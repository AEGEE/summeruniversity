const Joi = require('joi');
const moment = require('moment');

const { Sequelize, sequelize } = require('../lib/sequelize');

// TODO: require body_id if role is main_coordinator
// TODO: validate that role is in enum ['main_coordinator', 'content_manager', 'treasurer', 'incoming_responsible', 'general_organizer']
const organizersSchema = Joi.array().min(4).items(Joi.object().keys({
    user_id: Joi.number().integer().required(),
    body_id: Joi.number().integer(),
    role: Joi.string().required() // TODO: validate that there is 1 main_coordinator per organizing body, 1 content_manager, 1 treasurer and 1 incoming_responsible
}));

const locationsSchema = Joi.array().min(1).items(Joi.object().keys({
    name: Joi.string().required(),
    position: Joi.object().keys({
        lat: Joi.number().required(),
        lng: Joi.number().required()
    }),
    description: Joi.string().allow(''), // TODO: check that description is filled in for the second submission
    start: Joi.boolean(), // TODO: validate that there is 1 starting city
    end: Joi.boolean() // TODO: validate that there is 1 ending city
}));

const Event = sequelize.define(
    'event',
    {
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Event name should be set.' },
            }
        },
        url: {
            type: Sequelize.STRING,
            allowNull: true,
            validate: {
                isValid(value) {
                    if (!value) {
                        return;
                    }

                    if (!value.match(/^[a-zA-Z0-9-]+$/)) {
                        throw new Error('Event URL should only contain numbers, letters and dashes.');
                    }

                    if (value.match(/^[0-9-]+$/)) {
                        throw new Error('Event URL should have at least 1 letter.');
                    }
                }
            },
            unique: true
        },
        season: {
            // TODO: season should become a separate Model later
            type: Sequelize.INTEGER,
            allowNull: true
        },
        image: {
            type: Sequelize.STRING,
            allowNull: true
        },
        photos: {
        // TODO: check if JSONB is the type that we want, maybe an array of ids/location is enough?
            type: Sequelize.JSONB,
            allowNull: true
        // TODO: max 6 photos
        },
        video: {
            type: Sequelize.STRING,
            allowNull: true
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Event description should be set.' },
            }
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Email should be given.' },
                isEmail: { msg: 'Given email is not valid.' }
            }
        },
        website: {
            type: Sequelize.STRING,
            allowNull: true,
            validate: {
                isUrl: { msg: 'The provided link is not a valid URL.' }
            }
        },
        social_media: {
        // TODO: change this to an array of strings since we do not store anything else than the URL itself
            type: Sequelize.JSONB,
            allowNull: true,
            validate: {
            // TODO: validate that all provided strings are URLs
            // TODO: max 3 URLs
            }
        },
        application_starts: {
            type: Sequelize.DATE,
            allowNull: true,
            validate: {
                isDate: { msg: 'Event application starts date should be set.' }
            }
        },
        application_ends: {
            type: Sequelize.DATE,
            allowNull: true,
            validate: {
                isDate: { msg: 'Event application end date should be set.' },
                // laterThanApplicationStart(val) {
                //     if (moment(val).isSameOrBefore(this.application_starts)) {
                //         throw new Error('Application period cannot start after or at the same time it ends.');
                //     }
                // },
                beforeEventStart(val) {
                    if (moment(val).isSameOrAfter(this.starts)) {
                        throw new Error('Application period cannot end before or at the same time the event starts.');
                    }
                }
            }
        },
        starts: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Event start date should be set.' },
                isDate: { msg: 'Event start date should be valid.' }
            // TODO: check if within timeframe set by CIA/SUCT
            }
        },
        ends: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Event end date should be set.' },
                isDate: { msg: 'Event end date should be valid.' },
                laterThanStart(val) {
                    if (moment(val).isSameOrBefore(this.starts)) {
                        throw new Error('Event cannot start after or at the same time it ends.');
                    }
                }
            // TODO: check if within timeframe set by CIA/SUCT
            // TODO: check for duration, not too short (min 6 days) nor too long (max 28 days)
            }
        },
        fee: {
        // TODO: validate that it is max 14 euros per night for normal people but no max for SUCT/people with proper permission
            type: Sequelize.DECIMAL,
            allowNull: false,
            defaultValue: 0,
            validate: {
                notEmpty: { msg: 'Event fee should be set.' },
                isNumeric: { msg: 'Event fee should be valid.' },
                min: { args: [0], msg: 'Event fee cannot be negative' }
            }
        },
        optional_fee: {
            type: Sequelize.DECIMAL,
            allowNull: true,
            validate: {
                isNumeric: { msg: 'Optional fee should be valid.' },
                min: { args: [0], msg: 'Optional fee cannot be negative' },
                max: { args: [50], msg: 'Optional fee cannot be more than 50 euros.' }
            }
        },
        organizing_bodies: {
        // TODO: check if JSONB is the type that we want, maybe an array of ids is enough?
        // TODO: check that the body is a local
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
            validate: {
                isValid(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Organizing bodies should be an array.');
                    }

                    if (value.length === 0) {
                        throw new Error('At least 1 organizing body should be presented.');
                    }

                    for (const body of value) {
                        if (typeof body !== 'object' || body === null) {
                            throw new Error('Body is malformed.');
                        }

                        if (typeof body.body_id !== 'number') {
                            throw new Error('body_id should be an integer.');
                        }

                        if (typeof body.body_name !== 'string') {
                            throw new Error('body_name should be a string.');
                        }

                        if (body.body_name.trim().length === 0) {
                            throw new Error('body_name should not be empty.');
                        }
                    }
                }
            }
        },
        cooperation: {
        // TODO: check if JSONB is the type that we want, maybe an array of ids is enough?
        // TODO: validate for non-locals (or whatever EBs are allowed to do this)
        // TODO: max 2
        // TODO: do proper validation, either with Joi if JSONB is being used or just in here if an array of IDs is used
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: [],
            validate: {
                isValid(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Cooperation should be an array.');
                    }

                    for (const body of value) {
                        if (typeof body !== 'object' || body === null) {
                            throw new Error('Body is malformed.');
                        }

                        if (typeof body.body_id !== 'number') {
                            throw new Error('body_id should be an integer.');
                        }

                        if (typeof body.body_name !== 'string') {
                            throw new Error('body_name should be a string.');
                        }

                        if (body.body_name.trim().length === 0) {
                            throw new Error('body_name should not be empty.');
                        }
                    }
                }
            }
        },
        locations: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
            validate: {
                isValid(locationsValue) {
                    const { error, value } = locationsSchema.validate(locationsValue);
                    if (error) {
                        throw error;
                    }

                    // eslint-disable-next-line no-param-reassign
                    locationsValue = value;
                }
            }
        },
        type: {
            type: Sequelize.ENUM('regular', 'pilot'),
            allowNull: false,
            defaultValue: 'regular',
            validate: {
                notEmpty: { msg: 'SU type should be set.' },
                isIn: {
                    args: [['regular', 'pilot']],
                    msg: 'SU type should be one of these: normal, pilot.'
                }
            }
        },
        theme_category: {
            type: Sequelize.ENUM('arts_creativity', 'sustainability', 'local_culture', 'sports', 'social_equity', 'political_activism', 'mental_health', 'leisure', 'personal_development', 'volunteering'),
            allowNull: false,
            defaultValue: 'leisure',
            validate: {
                notEmpty: { msg: 'Theme should be set.' },
                isIn: {
                    args: [['arts_creativity', 'sustainability', 'local_culture', 'sports', 'social_equity', 'political_activism', 'mental_health', 'leisure', 'personal_development', 'volunteering']],
                    msg: 'Theme should be one of these: arts_creativity, sustainability, local_culture, sports, volunteering, social_equity, political_activism, mental_health, leisure, personal_development, volunteering.'
                }
            }
        },
        theme: {
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Theme explanation should be set.' },
            }
        },
        theme_implementation: {
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Explanation of theme implementation should be set.' },
            }
        },
        learning_objectives: {
        // TODO: change this to an array of strings since we do not store anything else than the learning objective itself
            type: Sequelize.JSONB,
            validate: {
                notEmpty: { msg: 'Learning objectives should be set.' },
            // TODO: min 2 and max 5 learning objectives
            }
        },
        status: {
            type: Sequelize.ENUM('first draft', 'first submission', 'first approval', 'second draft', 'second submission', 'second approval', 'covid draft', 'covid submission', 'covid approval'),
            allowNull: false,
            defaultValue: 'first draft',
            validate: {
                isIn: {
                    args: [['first draft', 'first submission', 'first approval', 'second draft', 'second submission', 'second approval', 'covid draft', 'covid submission', 'covid approval']],
                    msg: 'Event status is not valid.'
                }
            }
        },
        published: {
            type: Sequelize.ENUM('none', 'minimal', 'full', 'covid'),
            allowNull: false,
            defaultValue: 'none',
            validate: {
                isIn: {
                    args: [['none', 'minimal', 'full', 'covid']],
                    msg: 'Event publication must be none, minimal, full or covid.'
                }
            }
        },
        deleted: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        organizers: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
            validate: {
                isValid(organizersValue) {
                    const { error, value } = organizersSchema.validate(organizersValue);
                    if (error) {
                        throw error;
                    }

                    // eslint-disable-next-line no-param-reassign
                    organizersValue = value;
                }
            }
        },
        trainers: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        questions: {
        // TODO: change this to an array of strings since we do not store anything else than the question itself
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: [],
            validate: {
            // TODO: validate for maximum of 3 questions
                isValid(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Event questions should be an array of strings.');
                    }
                }
            }
        },
        pax_description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        pax_confirmation: {
            type: Sequelize.ENUM('no_confirmation', 'payment', 'ticket', 'payment_or_ticket', 'payment_and_ticket'),
            validate: {
                isIn: {
                    args: [['no_confirmation', 'payment', 'ticket', 'payment_or_ticket', 'payment_and_ticket']],
                    msg: 'Theme should be one of these: no_confirmation, payment, ticket, payment_or_ticket, payment_and_ticket.'
                }
            }
        },
        max_participants: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                isNumeric: { msg: 'Max amount of participants should be valid.' },
                // TODO: min 15 participants
                min: { args: [0], msg: 'Max amount of participants cannot be negative' }
            }
        },
        accepted_participants: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        available_spots: {
            type: Sequelize.VIRTUAL,
            get() {
                return this.max_participants - this.accepted_participants;
            }
        },
        application_status: {
            type: Sequelize.VIRTUAL,
            get() {
                return (moment().isBetween(this.application_starts, this.application_ends, null, '[]') || this.open_call === true)
                    ? 'open'
                    : 'closed'; // inclusive
            }
        },
        open_call: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        budget: {
            type: Sequelize.STRING,
            allowNull: true,
            validate: {
                isUrl: { msg: 'The provided link is not a valid URL.' }
            }
        },
        programme_suct: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'The programme for SUCT should be set.' },
                isUrl: { msg: 'The provided link is not a valid URL.' }
            }
        },
        programme: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        activities_list: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        optional_programme: {
        // TODO: if optional_fee is given, then optional_programme is required
            type: Sequelize.TEXT,
            allowNull: true
        },
        course_level: {
            type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
            allowNull: true,
            validate: {
                isIn: {
                    args: [['beginner', 'intermediate', 'advanced']],
                    msg: 'SU course level should be one of these: beginner, intermediate, advanced.'
                }
            }
        },
        courses: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        accommodation_type: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'The type of accommodation should be set.' },
            }
        },
        special_equipment: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        university_support: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        covid_regulations: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        cancellation_rules: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        additional_regulation: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        agreed_to_su_terms: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            validate: {
                isValid(value) {
                    if (value !== true) {
                        throw new Error('You should agree to the SU terms.');
                    }
                }
            }
        }
    },
    {
        underscored: true,
        tableName: 'events',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        validate: {
        // TODO: validate that the following fields are filled in properly;
        // firstSubmissionComplete() {
        // },
        // TODO: validate that the following fields are filled in properly;
        // secondSubmissionComplete() {
        //     if (!['first_draft', 'first_submission', 'first_approval'].includes(this.status)) {
        //         return;
        //     }
        // }
        }
    }
);

Event.beforeValidate(async (event) => {
    // skipping these fields if they are unset, will catch it later.
    if (typeof event.url === 'string') event.url = event.url.toLowerCase().trim();
});

Event.afterSave(async (event) => {
    if (event.available_spots === 0 && event.open_call === true) {
        event.open_call = false;
    }
});

module.exports = Event;
