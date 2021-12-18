const moment = require('moment');

// TODO: add season to views of events.js
// TODO: add Season things to frontend views
// TODO: add tests for Season and events in general hopefully
// TODO: after deployment; add season_ids to events

const { Sequelize, sequelize } = require('../lib/sequelize');

const Season = sequelize.define(
    'season',
    {
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Season name should be set.' },
            }
        },
        year: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                notEmpty: { msg: 'Season year should be set.' },
            }
        },
        su_earliest_date: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Earliest SU start date should be set.' },
                isDate: { msg: 'Earliest SU start date should be valid.' }
            }
        },
        su_latest_date: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'Latest SU end date should be set.' },
                isDate: { msg: 'Latest SU end date should be valid.' },
                laterThanStart(val) {
                    if (moment(val).isSameOrBefore(this.su_earliest_date)) {
                        throw new Error('SUs cannot end before the earliest start date.');
                    }
                }
            }
        },
        start_first_submission: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'First submission start date should be set.' },
                isDate: { msg: 'First submission start date should be valid.' }
            }
        },
        deadline_first_submission: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: { msg: 'First submission deadline date should be set.' },
                isDate: { msg: 'First submission deadline date should be valid.' },
                laterThanStart(val) {
                    if (moment(val).isSameOrBefore(this.start_first_submission)) {
                        throw new Error('Deadline cannot be before or at the same time the first submission period starts.');
                    }
                }
            }
        },
        first_submission_status: {
            type: Sequelize.VIRTUAL,
            get() {
                return (moment().isBetween(this.start_first_submission, this.deadline_first_submission, null, '[]'))
                    ? 'open'
                    : 'closed'; // inclusive
            }
        }
    },
    {
        underscored: true,
        tableName: 'seasons',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

module.exports = Season;
