const errors = require('./errors');
const { Season } = require('../models');

// Get all seasons and display them for SUCT/admins (GET /seasons)
exports.listSeasons = async (req, res) => {
    if (!req.permissions.list_seasons) {
        return errors.makeForbiddenError(res, 'You cannot see seasons.');
    }

    const seasons = await Season.findAll({
        order: [['created_at', 'ASC']]
    });

    return res.json({
        success: true,
        data: seasons,
    });
};

// Add a new season for SUCT/admins (POST /seasons)
exports.addSeason = async (req, res) => {
    // Check for permission
    if (!req.permissions.create_season) {
        return errors.makeForbiddenError(res, 'You cannot create a season.');
    }

    const newSeason = await Season.create(req.body);

    return res.json({
        success: true,
        message: 'Season is created.',
        data: newSeason,
    });
};

// Get the details of a season for SUCT/admins (GET /seasons/:season_id)
exports.getSeason = async (req, res) => {
    if (!req.permissions.view_season) {
        return errors.makeForbiddenError(res, 'You are not allowed to see this season.');
    }

    return res.json({
        success: true,
        data: req.season,
        permissions: req.permissions
    });
};

// Edit season for SUCT/admins (PUT /seasons/:season_id)
exports.editSeason = async (req, res) => {
    // Check for permission
    if (!req.permissions.edit_season) {
        return errors.makeForbiddenError(res, 'You cannot edit this season.');
    }

    await req.season.update(req.body);

    return res.json({
        success: true,
        message: 'Season is updated',
        data: req.season,
    });
};
