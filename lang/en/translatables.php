<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Translatable Language Lines
    |--------------------------------------------------------------------------
    |
    | The following are texts that can be translated in the admin dashboard
    |
    */
    'error'   => 'There was an error encountered',
    'success' => [
        'forgotPassword' => 'Reset password link already sent to you email.',
        'profile' => 'Profile successfully updated',
        'auth' => 'User successfully authenticated',
        'password' => 'Password successfully updated',
        'feedback' => 'Feedback successfully saved.',
        'inquiry' => 'Inquiry successfully submitted',
        'class_generated' => 'Command Generated.',
        'copy' => 'Copied!',
        'user' => [
            'login'  => 'User successfully authenticated',
            'logout' => 'User successfully signed out',
            'status' => [
                'update' => 'User status successfully updated'
            ],
            'create' => 'User successfully created'
        ],
        'class' => [
            'applications' => [
                'status' => [
                    'update' => 'Class application status successfully updated',
                ],
                'create' => 'Class application successfully created'
            ],
            'types' => [
                'update' => 'Class types successfully updated'
            ],
            'booking' => [
                'booked' => 'Class successfully booked',
                'cancelled' => 'Class successfully cancelled'
            ],
            'create' => 'Class successfully created',
            'update' => 'Class successfully updated',
            'delete' => 'Class successfully deleted'
        ],
        'category' => [
            'update' => 'Category successfully updated',
            'delete' => 'Category successfully deleted',
            'create' => 'Category successfully created'
        ],
        'classification' => [
            'update' => 'Classification successfully updated',
            'delete' => 'Classification successfully deleted',
            'create' => 'Classification successfully created'
        ],
        'translations' => [
            'update' => 'Translations successfully updated'
        ],
        'exams' => [
            'create' => 'Exam successfully created',
            'update_status' => 'Exam status successfully updated',
            'delete' => 'Exam successfully deleted',
            'update' => 'Exam successfully updated',
            'submit' => 'Exam successfully submitted'
        ],
        'schedules' => [
            'create' => 'Schedule successfully created',
            'delete' => 'Schedule successfully deleted',
            'update' => 'Schedule successfully updated'
        ],
        'wallet' => [
            'feed' => 'Points successfully added',
            'exchange' => 'Points successfully exchanged to NFT',
            'request_exchange' => 'Points successfully requested to exchanged to NFT',
        ],
        'api' => [
            'get' => 'Successfully retrieved data'
        ],
        'packages' => [
            'create' => 'Package successfully created'
        ]
    ],
    'confirm' => [
        'class' => [
            'applications' => [
                'approve' => 'Are you sure you want to approve this class application?',
                'deny' => 'Are you sure you want to deny this class application?'
            ],
            'types' => [
                'update' => 'Are you sure you want to update these class types?'
            ],
            'schedules' => [
                'book' => 'Are you sure you want to book this class?',
                'cancel' => 'Are you sure you want to cancel booking of this class?'
            ],
            'delete' => 'Are you sure you want to delete this class?'
        ],
        'user' => [
            'enable' => 'Are you sure you want to enable this user?',
            'disable' => 'Are you sure you want to disable this user?'
        ],
        'category' => [
            'delete' => 'Are you sure you want to delete this category?'
        ],
        'classification' => [
            'delete' => 'Are you sure you want to delete this classification?'
        ],
        'translations' => [
            'update' => 'Are you sure you want to update these translations?'
        ],
        'exams' => [
            'delete' => 'Are you sure you want to delete this exam?'
        ],
        'schedules' => [
            'delete' => 'Are you sure you want to delete this schedule?',
            'update' => 'Are you sure you want to update this schedule?'
        ]
    ],
    'title' => [
        'class' => [
            'applications' => [
                'index' => 'Class Applications',
                'view' => 'Class Application'
            ],
            'types' => 'Class Types',
            'manage' => [
                'index' => 'Manage Classes',
                'view' => 'Manage Class'
            ],
            'create' => 'Create Class'
        ],
        'users' => [
            'index' => 'Manage Users',
            'view' => 'User'
        ],
        'inquiries' => [
            'index' => 'Inquiries',
            'view' => 'Inquiry'
        ],
        'categories' => 'Categories',
        'classifications' => 'Classifications',
        'password' => [
            'update' => 'Update Password'
        ],
        'login' => 'Login',
        'translations' => 'Translations',
        'settings' => 'Settings',
        'exams' => 'Exams',
        'feedbacks' => 'Feedbacks',
        'schedules' => [
            'index'  => 'Schedules',
            'view'   => 'View Schedule',
            'create' => 'Create Schedule'
        ]
    ],
    'filters' => [
        'date' => [
            'asc' => 'Date - Oldest',
            'desc' => 'Date - Newest'
        ],
        'name' => [
            'asc' => 'Name A-Z',
            'desc' => 'Name Z-A'
        ],
        'price' => [
            'asc' => 'Price - Low to High',
            'desc' => 'Price - High to Low'
        ],
        'status' => [
            'active' => 'Active',
            'approved' => 'Approved',
            'denied' => 'Denied',
            'disabled' => 'Disabled',
            'pending' => 'Pending'
        ],
        'title' => [
            'asc' => 'Title A-Z',
            'desc' => 'Title Z-A',
        ],
        'rating' => [
            'asc' => 'Rating - Lowest',
            'desc' => 'Rating - Highest'
        ],
        'bookings' => [
            'asc' => 'Bookings - Low to High',
            'desc' => 'Bookings - High to Low'
        ],
        'schedule' => [
            'asc' => 'Date - ASC',
            'desc' => 'Date - DESC'
        ]
    ],
    'certification' => [
        'certificate_title' => 'Title',
        'awarded_by' => 'Awarded By',
        'awarded_at' => 'Awarded At',
    ],
    'education' => [
        'school' => 'School',
        'degree' => 'Degree',
    ],
    'work' => [
        'company' => 'Company',
        'position' => 'Position',
        'description' => 'Description',
    ],
    'user' => [
        'about' => 'About',
        'specialty' => 'Specialization',
    ],
    'class_schedule' => [
        'start_date' => 'Start Date',
        'number_users_booked' => 'Users Booked',
        'class_style' => 'On Demand/Live',
    ],
    'texts' => [
        'actions' => 'Actions',
        'add_choice' => 'Add Choice',
        'add_item' => 'Add Item',
        'admin' => 'Admin',
        'all' => 'All',
        'approve' => 'Approve',
        'back' => 'Back',
        'back_to_class' => 'Back to Class',
        'back_to_top' => 'Back to Top Page',
        'cancel' => 'Cancel',
        'cancellable' => 'Cancellable',
        'category' => 'Category',
        'choice' => 'Choice',
        'class_type' => 'Class Type',
        'class_image' => 'Class Image',
        'class_information' => 'Class Information',
        'classification' => 'Classification',
        'commission_rate' => 'Commission Rate',
        'confirm' => 'Confirm',
        'confirm_password' => 'Confirm Password',
        'content_information' => 'Content Information',
        'correct_value' => 'Correct Value',
        'country' => 'Country',
        'create_category' => 'Create Category',
        'create_classification' => 'Create Classification',
        'create_exam' => 'Create Exam',
        'create_package' => 'Create Package',
        'current_password' => 'Current Password',
        'days' => 'Days',
        'days_before_cancellation' => 'Days before cancellation',
        'deny' => 'Deny',
        'date' => 'Date',
        'date_applied' => 'Date Applied',
        'date_approved' => 'Date Approved',
        'date_created' => 'Date Created',
        'date_denied' => 'Date Denied',
        'date_joined' => 'Date Joined',
        'delete' => 'Delete',
        'delete_category' => 'Delete Category',
        'delete_class' => 'Delete Class',
        'delete_classification' => 'Delete Classification',
        'delete_schedule' => 'Delete Schedule',
        'disable' => 'Disable',
        'edit' => 'Edit',
        'edit_category' => 'Edit Category',
        'edit_class' => 'Edit Class',
        'edit_classification' => 'Edit Classification',
        'edit_exam' => 'Edit Exam',
        'edit_profile' => 'Edit Profile',
        'email' => 'Email',
        'enable' => 'Enable',
        'exam_name' => 'Exam Name',
        'filter' => 'Filter',
        'first_name' => 'First Name',
        'format' => 'Format',
        'free' => 'Free',
        'general_information' => 'General Information',
        'keyword' => 'Keyword',
        'language' => 'Language',
        'last_name' => 'Last Name',
        'mark_done' => 'Mark as Done',
        'message' => 'Message',
        'name' => 'Name',
        'new_password' => 'New Password',
        'next_question' => 'Next Question',
        'no_file_selected' => 'No file selected',
        'no_records_found' => 'No Records Found',
        'package' => 'Package',
        'package_information' => 'Package Information',
        'points' => 'Points',
        'points_earned' => 'Points Earned',
        'price' => 'Price',
        'pricing_information' => 'Pricing Information',
        'processing' => 'Processing',
        'profile' => 'Profile',
        'question' => 'Question',
        'rating' => 'Rating',
        'recommended_size' => 'Recommended size',
        'role' => 'Role',
        'save_changes' => 'Save Changes',
        'score' => 'Score',
        'search_name' => 'Search for name',
        'search_name_email' => 'Search for name or email',
        'search_name_email_subject' => 'Search for name, email, or subject',
        'search_title' => 'Search for title',
        'search_title_teacher' => 'Search for title or teacher',
        'seats' => 'Seats',
        'send_reply' => 'Send Reply',
        'sign_in' => 'Sign In',
        'sign_out' => 'Sign Out',
        'sort' => 'Sort',
        'status' => 'Status',
        'status_information' => 'Status Information',
        'subject' => 'Subject',
        'submit' => 'Submit',
        'take_exam' => 'Take Exam',
        'teacher' => 'Teacher',
        'teacher_information' => 'Teacher Information',
        'title' => 'Title',
        'total_items' => 'Total Items',
        'total_points' => 'Total Points',
        'type' => 'Type',
        'update_password' => 'Update Password',
        'update_password_help' => 'Enter your current password for verification',
        'update_password_notice' => 'You will be signed out when your password is updated',
        'update_profile' => 'Update Profile',
        'upload' => 'Upload',
        'view' => 'View',
        'video' => 'Video',
        'classes' => 'Classes',
        'classes_booked' => 'Classes Booked',
        'students' => 'Students',
        'teachers' => 'Teachers',
        'certification' => 'Certification',
        'education' => 'Education',
        'work' => 'Work',
        'live' => 'Live',
        'on_demand' => 'On demand',
        'book_class' => 'Book Class',
        'cancel_class_booking' => 'Cancel Class Booking',
        'attend_class' => 'Attend Class',
        'check_schedules' => 'Check Schedule',
        'book' => 'Book',
        'attend' => 'Attend',
<<<<<<< HEAD
        'exchange_points' => 'Exchange Points',
        'points_to_convert_to_nft' => 'Points to convert to NFT',
=======
        'add_points' => 'Add Points',
        'zoom_link' => 'Zoom Link'
>>>>>>> develop
    ]
];
