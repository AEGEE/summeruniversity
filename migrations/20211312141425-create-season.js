module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('seasons', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            year: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            su_earliest_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            su_latest_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            start_first_submission: {
                type: Sequelize.DATE,
                allowNull: false
            },
            deadline_first_submission: {
                type: Sequelize.DATE,
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('seasons');
    }
};
