// TODO: If upload has error, multer will block next request
// Nodejs app will be blocked next request,
// And become normal after request again
// I don't find any solution for this problem
// But It is ok for now, because I will limit file size to 10M and filter file type at client side
// To make sure error will not happen
// https://github.com/expressjs/multer/issues/53#issuecomment-1168608705

const multer = require('multer');
const mkdirp = require('mkdirp');
const path = require('path');
const { Course } = require('../../models');
const translate = require('../../utils/translate');
const { MAX_PROBLEM_FILE_SIZE } = require('../../constants/constants');

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // Check if course exists
    const courseId = req.body.courseId;

    if (!courseId) {
      return cb(new Error(translate('required_course_id', req.hl)));
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return cb(new Error(translate('invalid_course_id', req.hl)));
    }

    const courseCode = course.code;

    const made = mkdirp.sync(`./public/problems/${courseCode}`);
    cb(null, `./public/problems/${courseCode}`);
  },
  filename: function (req, file, cb) {
    console.log(file);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_PROBLEM_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.pdf') {
      return cb(new Error(translate('file_type_not_supported', req.hl)));
    }

    return cb(null, true);
  },
}).single('pdfFile');

const uploadPdf = (req, res, next) =>
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(400)
          .json({ message: translate('limit_file_size', req.hl) });
      }
      return res.status(400).json({ message: error.code });
    } else if (error) {
      return res.status(400).json({ message: error.message });
    } else {
      next();
    }
  });

module.exports = uploadPdf;
