const core = require('./core');
const errors = require('./errors');
const { Application } = require('../models');
const helpers = require('./helpers');
const mailer = require('./mailer');
const { sequelize } = require('./sequelize');

exports.listAllApplications = async (req, res) => {
    if (!req.permissions.list_applications) {
        return errors.makeForbiddenError(res, 'You cannot see applications for this event.');
    }

    const applications = await Application.findAll({
        where: { event_id: req.event.id },
        order: [['created_at', 'ASC']]
    });

    return res.json({
        success: true,
        data: applications,
    });
};

exports.getApplication = async (req, res) => {
    if (!req.permissions.view_application) {
        return errors.makeForbiddenError(res, 'You are not allowed to see this application.');
    }

    return res.json({
        success: true,
        data: req.application,
        permissions: req.permissions
    });
};

exports.createApplication = async (req, res) => {
    // Check for permission
    if (!req.permissions.apply) {
        return errors.makeForbiddenError(res, 'You cannot apply to this event.');
    }

    if (typeof req.body.body_id !== 'undefined' && !helpers.isMemberOf(req.user, req.body.body_id)) {
        return errors.makeBadRequestError(res, 'You are not a member of this body.');
    }

    delete req.body.board_comment;
    delete req.body.status;

    req.body.first_name = req.user.first_name;
    req.body.last_name = req.user.last_name;
    req.body.body_name = req.user.bodies.find((b) => b.id === req.body.body_id).name;
    req.body.user_id = req.user.id;
    req.body.event_id = req.event.id;

    let newApplication;

    // Doing it inside of a transaction, so it'd fail and revert if mail was not sent.
    await sequelize.transaction(async (t) => {
        newApplication = await Application.create(req.body, { transaction: t });

        // Sending the mail to a user.
        await mailer.sendMail({
            to: req.user.notification_email,
            subject: `You've successfully applied for ${req.event.name}`,
            template: 'summeruniversity_applied.html',
            parameters: {
                application: newApplication,
                event: req.event
            }
        });

        req.event.organizers = await Promise.all(req.event.organizers.map((organizer) =>
            core.fetchUser(organizer, req.headers['x-auth-token'])));

        // Sending the mail to the organizers
        await mailer.sendMail({
            to: req.event.organizers.map((organizer) => organizer.notification_email),
            subject: `Somebody has applied for ${req.event.name}`,
            template: 'summeruniversity_organizer_applied.html',
            parameters: {
                application: newApplication,
                event: req.event
            }
        });

        // Sending emails to board members of this body.
        const boardMembers = await core.getBodyUsersForPermission({
            action: 'approve_members',
            object: 'summeruniversity'
        }, newApplication.body_id);

        if (boardMembers.length > 0) {
            await mailer.sendMail({
                to: boardMembers.map((member) => member.user.notification_email),
                subject: `One of your body members has applied to ${req.event.name}`,
                template: 'summeruniversity_board_applied.html',
                parameters: {
                    application: newApplication,
                    event: req.event
                }
            });
        }
    });

    return res.json({
        success: true,
        message: 'Application is created.',
        data: newApplication,
    });
};

exports.updateApplication = async (req, res) => {
    // Check for permission
    if (!req.permissions.edit_application) {
        return errors.makeForbiddenError(res, 'You cannot edit this application.');
    }

    if (typeof req.body.body_id !== 'undefined' && !helpers.isMemberOf(req.user, req.body.body_id)) {
        return errors.makeForbiddenError(res, 'You are not a member of this body.');
    }

    delete req.body.board_comment;
    delete req.body.status;

    // TODO fix this so applications can be updated by SUCT/admins
    req.body.first_name = req.user.first_name;
    req.body.last_name = req.user.last_name;
    if (typeof req.body.body_id !== 'undefined') {
        req.body.body_name = req.user.bodies.find((b) => b.id === req.body.body_id).name;
    }
    req.body.user_id = req.user.id;
    req.body.event_id = req.event.id;

    await sequelize.transaction(async (t) => {
        // Updating application in a transaction, so if mail sending fails, the update would be reverted.
        await req.application.update(req.body, { transaction: t });

        const notificationEmail = (await core.fetchUser(req.body, req.headers['x-auth-token'])).notification_email;

        // Sending the mail to a user.
        await mailer.sendMail({
            to: notificationEmail,
            subject: `Your application for ${req.event.name} was updated`,
            template: 'summeruniversity_application_edited.html',
            parameters: {
                application: req.application,
                event: req.event
            }
        });

        req.event.organizers = await Promise.all(req.event.organizers.map((organizer) =>
            core.fetchUser(organizer, req.headers['x-auth-token'])));

        // Sending the mail to the organizers
        await mailer.sendMail({
            to: req.event.organizers.map((organizer) => organizer.notification_email),
            subject: `Somebody has updated their application for ${req.event.name}`,
            template: 'summeruniversity_organizer_edited.html',
            parameters: {
                application: req.application,
                event: req.event
            }
        });

        // Sending emails to board members of this body.
        const boardMembers = await core.getBodyUsersForPermission({
            action: 'approve_members',
            object: 'summeruniversity'
        }, req.application.body_id);

        if (boardMembers.length > 0) {
            await mailer.sendMail({
                to: boardMembers.map((member) => member.user.notification_email),
                subject: `One of your body members has updated their application to ${req.event.name}`,
                template: 'summeruniversity_board_edited.html',
                parameters: {
                    application: req.application,
                    event: req.event
                }
            });
        }
    });

    return res.json({
        success: true,
        message: 'Application is updated',
        data: req.application,
    });
};

exports.setApplicationConfirmed = async (req, res) => {
    if (!req.permissions.set_participants_confirmed) {
        return errors.makeForbiddenError(res, 'You don\'t have permissions to change this application.');
    }

    const dbResult = await req.application.update(
        { confirmed: req.body.confirmed },
        { returning: ['*'] }
    );

    return res.json({
        success: true,
        data: dbResult
    });
};

exports.setApplicationAttended = async (req, res) => {
    if (!req.permissions.set_participants_attended) {
        return errors.makeForbiddenError(res, 'You don\'t have permissions to change this application.');
    }

    const dbResult = await req.application.update(
        { attended: req.body.attended },
        { returning: ['*'] }
    );

    return res.json({
        success: true,
        data: dbResult
    });
};

exports.setApplicationCancelled = async (req, res) => {
    if (!req.permissions.set_participants_cancelled && !req.permissions.set_application_cancelled) {
        return errors.makeForbiddenError(res, 'You don\'t have permissions to change this application.');
    }

    const dbResult = await req.application.update(
        { cancelled: req.body.cancelled },
        { returning: ['*'] }
    );

    const acceptedParticipants = await Application.count({ where: {
        event_id: req.event.id,
        status: 'accepted',
        cancelled: false
    } });
    await req.event.update({ accepted_participants: acceptedParticipants });

    return res.json({
        success: true,
        data: dbResult
    });
};

exports.setApplicationStatus = async (req, res) => {
    // Check user permissions
    if (!req.permissions.approve_participants) {
        return errors.makeForbiddenError(res, 'You are not allowed to accept or reject participants');
    }

    await sequelize.transaction(async (t) => {
        // Updating application in a transaction, so if mail sending fails, the update would be reverted.
        await req.application.update({ status: req.body.status }, { transaction: t });

        const notificationEmail = (await core.fetchUser(req.application, req.headers['x-auth-token'])).notification_email;

        // Sending the mail to a user.
        await mailer.sendMail({
            to: notificationEmail,
            subject: `Your application status for ${req.event.name} was updated`,
            template: 'summeruniversity_application_status_updated.html',
            parameters: {
                application: req.application,
                event: req.event
            }
        });
    });

    const acceptedParticipants = await Application.count({ where: {
        event_id: req.event.id,
        status: 'accepted',
        cancelled: false
    } });
    await req.event.update({ accepted_participants: acceptedParticipants });

    return res.json({
        success: true,
        data: req.application
    });
};

exports.setApplicationComment = async (req, res) => {
    // Check user permissions
    if (!req.permissions.set_board_comment[req.application.body_id]) {
        return errors.makeForbiddenError(res, 'You are not allowed to put board comments');
    }

    // Save changes
    await req.application.update({ board_comment: req.body.board_comment });

    return res.json({
        success: true,
        data: req.application
    });
};