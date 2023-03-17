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
        'verification_sent' => 'Verification link successfully sent',
        'user' => [
            'login'  => 'User successfully authenticated',
            'logout' => 'User successfully signed out',
            'status' => [
                'update' => 'User status successfully updated'
            ],
            'create' => 'User successfully created',
            'register' => 'User successfully registered',
            'verified' => 'User successfully verified'
        ],
        'teacher_applications' => [
            'submitted' => 'Teacher application successfully submitted'
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
                'cancelled' => 'Class booking successfully cancelled'
            ],
            'create' => 'Class successfully created',
            'update' => 'Class successfully updated',
            'delete' => 'Class successfully deleted',
            'completed' => 'Class successfully completed'
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
        ],
        'badge' => [
            'earn' => 'You have successfully received a badge'
        ],
        'points' => [
            'earn' => 'You have successfully earned points: '
        ],
        'video' => [
            'watched' => 'You have successfully watched the class video'
        ],
        'live_class' => [
            'attended' => 'You have successfully attended a live class'
        ],
        'update' => 'Successfully updated',
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
        ],
        'settings' => [
            'update' => 'Are you sure you want to update this settings?'
        ]
    ],
    'title' => [
        'class' => [
            'applications' => [
                'index' => 'Class Applications',
                'view' => 'Class Application',
                'create' => 'Create Class Application'
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
        'general' => 'General',
        'translations' => 'Translations',
        'settings' => 'Settings',
        'exams' => 'Exams',
        'feedbacks' => 'Feedbacks',
        'schedules' => [
            'index'  => 'Schedules',
            'view'   => 'View Schedule',
            'create' => 'Create Schedule'
        ],
        'top_page' => 'Welcome to LE Bazaar',
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
        'background' => 'Educational Background'
    ],
    'work' => [
        'company' => 'Company',
        'position' => 'Position',
        'description' => 'Description',
        'history' => 'Professional History'
    ],
    'user' => [
        'about' => 'About',
        'specialty' => 'Specialization',
        'university' => 'School/University'
    ],
    'class_schedule' => [
        'start_date' => 'Start Date',
        'end_date' => 'End Date',
        'number_users_booked' => 'Users Booked',
        'class_style' => 'On Demand/Live',
    ],
    'wallet_history' => [
        'type' => 'Transaction Type',
        'id' => 'Transaction ID',
    ],
    'top_page' => [
        'description' => 'learning bazaar welcome description',
    ],
    'texts' => [
        'actions' => 'Actions',
        'add_choice' => 'Add Choice',
        'add_item' => 'Add Item',
        'add_points' => 'Add Points',
        'admin' => 'Admin',
        'all' => 'All',
        'application_submitted' => 'Application Submitted',
        'application_submitted_description' => 'The application will undergo an approval process. You will receive an email notification once there is an update on your application',
        'approve' => 'Approve',
        'attend' => 'Attend',
        'attend_class' => 'Attend Class',
        'back' => 'Back',
        'back_to_class' => 'Back to Class',
        'basic_information' => 'Basic Information',
        'back_to_sign_in' => 'Back to sign in',
        'back_to_top' => 'Back to Top Page',
        'badges' => 'Badges',
        'badges_claimed' => 'Badges Claimed',
        'badge_name' => 'Badge Name',
        'book' => 'Book',
        'booked_date' => 'Booked Date',
        'book_class' => 'Book for',
        'browse_classes' => 'Browse Classes',
        'cancel' => 'Cancel',
        'cancellable' => 'Cancellable',
        'cancel_class_booking' => 'Cancel Booking',
        'category' => 'Category',
        'certification' => 'Certification',
        'check_schedules' => 'Check Schedule',
        'choice' => 'Choice',
        'choose_role' => 'Choose you role',
        'class' => 'Class',
        'classes' => 'Classes',
        'classes_booked' => 'Classes Booked',
        'class_name' => 'Class Name',
        'class_history' => 'Class History',
        'class_image' => 'Class Image',
        'class_information' => 'Class Information',
        'class_type' => 'Class Type',
        'classification' => 'Classification',
        'claim_all' => 'Claim all',
        'commission_rate' => 'Commission Rate',
        'confirm' => 'Confirm',
        'confirm_password' => 'Confirm Password',
        'content_information' => 'Content Information',
        'content' => 'Content',
        'coming_soon' => 'Coming Soon',
        'complete' => 'Complete',
        'complete_class' => 'Complete Class',
        'complete_class_description' => 'Congratulations! You have successfully completed this class',
        'complete_class_earn_badge' => 'Complete this class to earn a badge',
        'complete_classes_earn_badge' => 'Complete these classes to earn a badge',
        'correct_value' => 'Correct Value',
        'country' => 'Country',
        'create_account' => 'Create Account',
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
        'description' => 'Description',
        'disable' => 'Disable',
        'done_watching' => 'Done Watching',
        'edit' => 'Edit',
        'edit_category' => 'Edit Category',
        'edit_class' => 'Edit Class',
        'edit_classification' => 'Edit Classification',
        'edit_exam' => 'Edit Exam',
        'edit_profile' => 'Edit Profile',
        'education' => 'Education',
        'email' => 'Email',
        'enable' => 'Enable',
        'exam_name' => 'Exam Name',
        'exchange_badges' => 'Exchange Badges',
        'exchange_points' => 'Exchange Points',
        'export_csv' => 'Export CSV',
        'export_items' => 'Export items',
        'featured_classes' => 'Featured Classes',
        'feed_points' => 'Feed Points',
        'filter' => 'Filter',
        'first_name' => 'First Name',
        'forgot_password' => 'Forgot Password',
        'format' => 'Format',
        'free' => 'Free',
        'frequency' => 'Frequency',
        'from' => 'From',
        'fully_booked' => 'Fully Booked',
        'featured_teachers' => 'Featured Teachers',
        'general_information' => 'General Information',
        'give_feedback' => 'Give Feedback',
        'give_feedback_description' => 'Let us know what you think of this class',
        'home' => 'Home',
        'inquiry_help' => 'Must be less than 200 characters',
        'keyword' => 'Keyword',
        'language' => 'Language',
        'last_name' => 'Last Name',
        'length' => 'Length',
        'live' => 'Live',
        'live_class' => 'Live Class',
        'live_class_description' => 'Attend the live Zoom class together with the teacher and fellow attendees',
        'load_more' => 'Load More',
        'mark_done' => 'Mark as Done',
        'message' => 'Message',
        'mypage' => 'My Page',
        'name' => 'Name',
        'new_category'  => 'New Category',
        'new_password' => 'New Password',
        'next_question' => 'Next Question',
        'no_file_selected' => 'No file selected',
        'no_records_found' => 'No Records Found',
        'no_schedules_available' => 'No Schedules Available',
        'on_demand' => 'On demand',
        'overall_rating' => 'Overall Rating',
        'package' => 'Package',
        'package_information' => 'Package Information',
        'password_help' => 'Must have at least 8 characters',
        'password' => 'Password',
        'change_password' => 'Change Password',
        'points' => 'Points',
        'points_earned' => 'Points Earned',
        'price' => 'Price',
        'pricing_information' => 'Pricing Information',
        'processing' => 'Processing',
        'profile' => 'Profile',
        'points_to_convert_to_nft' => 'Points to convert to NFT',
        'question' => 'Question',
        'rating' => 'Rating',
        'recommended_size' => 'Recommended size',
        'redirect_to_live_class' => 'Redirect to Live class',
        'role' => 'Role',
        'save_changes' => 'Save Changes',
        'score' => 'Score',
        'search' => 'Search',
        'search_class_name' => 'Search for class name',
        'search_name' => 'Search for name',
        'search_name_email' => 'Search for name or email',
        'search_name_email_subject' => 'Search for name, email, or subject',
        'search_title' => 'Search for title',
        'search_title_teacher' => 'Search for title or teacher',
        'seats' => 'Seats',
        'seats_available' => 'seats available',
        'send_reply' => 'Send Reply',
        'send_request' => 'Send Request',
        'sign_in' => 'Sign In',
        'sign_up' => 'Sign up',
        'sign_out' => 'Sign Out',
        'sign_up_student' => 'Student Sign Up',
        'sign_up_teacher' => 'Teacher Sign Up',
        'sort' => 'Sort',
        'status' => 'Status',
        'status_information' => 'Status Information',
        'students' => 'Students',
        'subject' => 'Subject',
        'submit' => 'Submit',
        'take_exam' => 'Take Exam',
        'take_exam_description' => 'Take exam to gauge what you learned in this class',
        'teacher' => 'Teacher',
        'teachers' => 'Teachers',
        'teacher_information' => 'Teacher Information',
        'teaching_history' => 'Teaching History',
        'temporary_password_notice' => 'Your password is still the temporary. For security purposes, please update your password',
        'title' => 'Title',
        'to' => 'To',
        'to_convert_to_nft' => 'to convert to NFT',
        'total_items' => 'Total Items',
        'total_points' => 'Total Points',
        'total_badges' => 'Total Badges',
        'transaction_date' => 'Transaction Date',
        'type' => 'Type',
        'update_password' => 'Update Password',
        'update_password_help' => 'Enter your current password for verification',
        'update_password_notice' => 'You will be signed out when your password is updated',
        'update_profile' => 'Update Profile',
        'upload' => 'Upload',
        'view' => 'View',
        'view_more' => 'View more',
        'view_profile' => 'View Profile',
        'video' => 'Video',
        'wallet_balance' => 'Wallet balance',
        'wallet_book_details' => 'Booked class',
        'wallet_commission_details' => 'Points commissioned in class',
        'wallet_earn_details' => 'Earned from class',
        'wallet_exchange_details' => 'Points Exchanged to NFT',
        'wallet_feed_details' => 'Points Feed to wallet',
        'wallet_history' => 'Wallet History',
        'wallet_refund_details' => 'Refunded points from class',
        'watch_video' => 'Watch Video',
        'watch_video_description' => 'Watch the video to learn the contents of the class',
        'welcome' => 'Welcome',
        'work' => 'Work',
        'class_url' => 'Class meeting URL'
    ]
];
