module.exports = {
    EVENT_MINIMAL_FIELDS: [
        'id',
        'name',
        'url',
        'season',
        'image',
        'description',
        'email',
        'starts',
        'ends',
        'fee',
        'organizing_bodies',
        'locations',
        'type',
        'theme_category',
        'theme',
        'max_participants',
        'accommodation_type',
        'optional_fee',
        'optional_programme',
        'published',
        'application_status',
        'created_at',
        'updated_at'
    ],
    EVENT_FULL_FIELDS: [
        'id',
        'name',
        'url',
        'season',
        'image',
        'photos',
        'video',
        'description',
        'email',
        'website',
        'social_media',
        'starts',
        'ends',
        'fee',
        'organizing_bodies',
        'locations',
        'type',
        'theme_category',
        'theme',
        'trainers',
        'pax_description',
        'pax_confirmation',
        'max_participants',
        'accommodation_type',
        'activities_list',
        'course_level',
        'courses',
        'special_equipment',
        'university_support',
        'optional_fee',
        'optional_programme',
        'published',
        'application_status',
        'created_at',
        'updated_at'
    ],
    EVENT_COVID_FIELDS: [
        'id',
        'name',
        'url',
        'season',
        'image',
        'photos',
        'video',
        'description',
        'email',
        'website',
        'social_media',
        'starts',
        'ends',
        'fee',
        'organizing_bodies',
        'locations',
        'type',
        'theme_category',
        'theme',
        'trainers',
        'pax_description',
        'pax_confirmation',
        'questions',
        'max_participants',
        'accepted_participants',
        'available_spots',
        'open_call',
        'accommodation_type',
        'activities_list',
        'course_level',
        'courses',
        'special_equipment',
        'university_support',
        'optional_fee',
        'optional_programme',
        'covid_regulations',
        'cancellation_rules',
        'additional_regulation',
        'application_status',
        'published',
        'application_ends',
        'created_at',
        'updated_at'
    ],
    APPLICATION_FIELD_NAMES: {
        first_name: 'First name',
        last_name: 'Last name',
        gender: 'Gender',
        date_of_birth: 'Date of birth',
        nationality: 'Nationality',
        body_name: 'Body',
        travelling_from: 'Travelling from',
        created_at: 'Application date',
        notification_email: 'Email address',
        visa_required: 'Visa required?',
        meals: 'Meals type',
        allergies: 'Allergies',
        status: 'Status',
        confirmed: 'Confirmed?',
        attended: 'Attended?',
        board_comment: 'Board comment',
        aegee_experience: 'AEGEE experience',
        ideal_su: 'Ideal SU',
        motivation: 'Motivation',
    },
    EVENT_TYPES: ['regular', 'pilot'],
    CURRENT_USER_PREFIX: 'me'
};
