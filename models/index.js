const Event = require('./Event');
const Application = require('./Application');
const Season = require('./Season');

Event.hasMany(Application, { foreignKey: 'event_id' });
Application.belongsTo(Event, { foreignKey: 'event_id' });
Season.hasMany(Event, { foreignKey: 'season_id' });
Event.belongsTo(Season, { foreignKey: 'season_id' });

module.exports = {
    Event,
    Application,
    Season
};
