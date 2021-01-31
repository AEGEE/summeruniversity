const path = require('path');
const multer = require('multer');
const readChunk = require('read-chunk');
const FileType = require('file-type');
const util = require('util');

const errors = require('./errors');
const log = require('./logger');
const config = require('../config');
const fs = require('./fs');

const uploadFolderName = `${config.media_dir}/headimages`;
const allowedExtensions = ['.png', '.jpg', '.jpeg'];

const storage = multer.diskStorage({ // multers disk storage settings
    destination(req, file, cb) {
        cb(null, uploadFolderName);
    },

    // Filename is 4 character random string and the current datetime to avoid collisions
    filename(req, file, cb) {
        const prefix = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 4);
        const date = (new Date()).getTime();
        const extension = path.extname(file.originalname);

        cb(null, `${prefix}-${date}${extension}`);
    },
});
const upload = multer({
    storage,
    fileFilter(req, file, cb) {
        const extension = path.extname(file.originalname);
        if (!allowedExtensions.includes(extension)) {
            const allowed = allowedExtensions.map((e) => `'${e}'`).join(', ');
            return cb(new Error(`Allowed extensions: ${allowed}, but '${extension}' was passed.`));
        }

        return cb(null, true);
    },
}).single('head_image');

const uploadAsync = util.promisify(upload);

exports.uploadImage = async (req, res) => {
    const oldimg = req.event.image;

    // If upload folder doesn't exists, create it.
    if (!await fs.existsSync(uploadFolderName)) {
        await fs.mkdir(uploadFolderName, { recursive: true });
    }

    try {
        await uploadAsync(req, res);
    } catch (err) {
        log.error({ err }, 'Could not store image');
        return errors.makeValidationError(res, err);
    }

    // If the head_image field is missing, do nothing.
    if (!req.file) {
        return errors.makeValidationError(res, 'No head_image is specified.');
    }

    // If the file's content is malformed, don't save it.
    const buffer = readChunk.sync(req.file.path, 0, 4100);
    const type = await FileType.fromBuffer(buffer);

    const originalExtension = path.extname(req.file.originalname);
    const determinedExtension = (type && type.ext ? `.${type.ext}` : 'unknown');

    if (originalExtension !== determinedExtension || !allowedExtensions.includes(determinedExtension)) {
        return errors.makeValidationError(res, 'Malformed file content.');
    }

    await req.event.update({
        image: req.file.filename
    });

    // Remove old file
    if (oldimg) {
        await fs.remove(path.join(uploadFolderName, oldimg));
    }

    return res.json({
        success: true,
        message: 'File uploaded successfully',
        data: req.event.image,
    });
};
