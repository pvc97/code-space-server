const multer = require('multer');
const mkdirp = require('mkdirp');
const { Course } = require('../../models');
const translate = require('../../utils/translate');

const uploadPdf = (req, res, next) => {
  const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
      // Check if course exists
      const courseId = req.body.courseId;

      if (!courseId) {
        return res
          .status(400)
          .send({ error: translate('required_course_id', req.hl) });
      }

      // Check if course exists
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res
          .status(400)
          .send({ error: translate('invalid_course_id', req.hl) });
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
    fileFilter: function (req, file, cb) {
      if (file.originalname.endsWith('pdf')) {
        cb(null, true);
      } else {
        // cb(new Error('File type is not supported'));
        cb(new Error(translate('file_type_not_supported', req.hl)));
      }
    },
  }).single('content');

  upload(req, res, (error) => {
    if (error) {
      res.status(400).json({ message: error.message });
    } else {
      next();
    }
  });
};

module.exports = uploadPdf;
