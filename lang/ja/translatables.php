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
    'error'=> 'エラーが発生しました',
    'nft_error'   => [
        'used' =>'このNFTはすでに使用済みです',
        'not_found' => 'ウォレットにNFTが見つかりません',
        'verify' => 'NFTを検証できませんでした'
    ],
    'wallet_error'   => [
        'insufficient_funds' => 'ウォレット残高が不足しています。クレジットカードでのお支払いをご検討ください。',
        'not_connected' => 'ウォレットが接続されていません',
        'not_found' => 'ウォレットが見つかりません',
        'no_signin' => 'ウォレットにアクセスするにはサインインが必要です',
        'verify' => 'ウォレットを確認できませんでした',
        'disconnected' => 'ウォレットが切断されました。続けるには再接続してください。',
        'account_changed' => 'ウォレットアカウントが変更されました。続けるには再接続してください。',
        'network_changed' => 'ウォレットのネットワークが切り替わりました。続けるにはウォレットを再接続してください。',
    ],
    'success'=> [
        'category'=> [
            'create'=> '分類は作成されました',
            'delete'=> '分類は消去されました',
            'update'=> '分類は更新されました'
        ],
        'class'=> [
            'applications'=> [
                'status'=> [
                    'update'=> 'クラス申請のステータスが正常に更新されました'
                ],
                'create'=> 'クラス申請は作成されました'
            ],
            'booking'=> [
                'cancelled'=> 'クラス予約はキャンセルされました',
                'booked'=> 'クラスは正常に予約されました'
            ],
            'donated' => '講師への寄付が完了しました',
            'completed'=> 'クラス受講完了しました',
            'create'=> 'クラスは正常に作成されました',
            'delete'=> 'クラスは正常に削除されました',
            'update'=> 'クラスは正常に更新されました',
            'types'=> [
                'update'=> 'クラスタイプが正常に更新されました'
            ]
        ],
        'classification'=> [
            'create'=> '区分は正常に作成されました',
            'delete'=> '区分は正常に消去されました',
            'update'=> '区分は正常に更新されました'
        ],
        'class_generated'=> 'コマンドが生成されました',
        'copy'=> 'コピーしました！',
        'exams'=> [
            'update_status'=> 'Examは正常に更新されました',
            'create'=> 'Examは正常に作成されました',
            'delete'=> 'Examは正常に消去されました',
            'submit'=> 'Exam提出完了',
            'update'=> 'Exam更新完了',
            'cleared' => '試験が正常にクリアされました',
            'request_retake' => '試験再受験リクエストが正常に送信されました'
        ],
        'feedback'=> 'フィードバックは正常に保存されました',
        'inquiry'=> 'お問い合わせは正常に送信されました',
        'nft' => 'NFTの検証に成功しました',
        'packages'=> [
            'create'=> 'パッケージは正常に作成されました'
        ],
        'password'=> 'パスワードは正常に更新されました',
        'wallet'=> [
            'feed'=> 'ポイントは正常に追加されました',
            'exchange'=> 'ポイントは正常にNFTに変換されました',
            'request_exchange'=> 'ポイント変換は正常に提出されました',
            'verify' => 'ウォレットの認証に成功しました'
        ],
        'profile'=> 'プロファイルは更新されました',
        'forgotPassword'=> 'リセットパスワードは送信されました',
        'schedules'=> [
            'create'=> 'スケジュールが正常に作成されました',
            'delete'=> 'スケジュールが正常に消去されました',
            'update'=> 'スケジュールが正常に更新されました'
        ],
        'api'=> [
            'get'=> 'データの取得に成功しました'
        ],
        'update'=> '正常に更新されました',
        'teacher_applications'=> [
            'submitted'=> '講師申請は正常に提出されました'
        ],
        'translations'=> [
            'update'=> '翻訳は正常に更新されました'
        ],
        'user'=> [
            'status'=> [
                'update'=> 'ユーザー状態が更新されました'
            ],
            'login'=> 'ユーザーが正常に認証されました',
            'create'=> 'ユーザーが正常に作成されました',
            'register'=> 'ユーザー登録完了',
            'logout'=> 'ユーザーはサイアウトされました',
            'verified'=> 'ユーザーは確認されました'
        ],
        'auth'=> 'ユーザーが正常に認証されました',
        'verification_sent'=> '確認リンクは正常に送信されました',
        'live_class'=> [
            'attended'=> 'ライブクラスの受講が終わりました'
        ],
        'points'=> [
            'earn'=> 'ポイントの獲得に成功しました'
        ],
        'badge'=> [
            'earn'=> 'バッジの取得に成功しました'
        ],
        'video'=> [
            'watched'=> 'ビデオの閲覧は終了しました'
        ],
        'refund' => [
            'stripe' => 'Stripe返金が正常に処理されました。',
            'ada'    => 'ADA返金トランザクションが送信されました。',
        ],
    ],
    'confirm'=> [
        'class'=> [
            'applications'=> [
                'approve'=> 'このクラス申請を承認してよろしいですか？',
                'deny'=> 'このクラス応募を拒否しますか？'
            ],
            'schedules'=> [
                'book'=> 'このクラスを申込みますか？',
                'cancel'=> 'このクラスをキャンセルしますか？'
            ],
            'delete'=> 'このクラスを消去しますか？',
            'types'=> [
                'update'=> 'クラスタイプを更新しますか？'
            ]
        ],
        'category'=> [
            'delete'=> 'このカテゴリを消去しますか？'
        ],
        'classification'=> [
            'delete'=> 'この区分を消去しますか？'
        ],
        'exams'=> [
            'delete'=> 'このテストを消去しますか？',
            'answers' => [
                'delete' => 'この生徒の試験をクリアしてもよろしいですか？'
            ]
        ],
        'schedules'=> [
            'delete'=> 'このスケジュールを消去しますか？',
            'update'=> 'スケジュールを更新して良いですか？'
        ],
        'user'=> [
            'disable'=> 'この生徒を無効にしますか？',
            'enable'=> 'この生徒を有効化しますか？'
        ],
        'nft'=> [
            'delete'=> 'このNFTを削除してもよろしいですか？'
        ],
        'mobile' => [
            'view' => 'モバイルウォレットブラウザに移動してもよろしいですか？'
        ],
        'translations'=> [
            'update'=> '翻訳を更新して良いですか？'
        ],
        'settings'=> [
            'update'=> 'この設定を更新して良いですか？'
        ]
    ],
    'title'=> [
        'categories'=> 'カテゴリー',
        'class'=> [
            'applications'=> [
                'view'=> 'クラス申請',
                'index'=> 'クラス申請',
                'create'=> 'クラス申請作成'
            ],
            'types'=> 'クラスタイプ',
            'create'=> 'クラス作成',
            'manage'=> [
                'view'=> 'クラス管理',
                'index'=> 'クラス管理'
            ]
        ],
        'classifications'=> '区分',
        'clear_exam' => '試験クリア',
        'schedules'=> [
            'create'=> 'スケジュール作成',
            'index'=> 'スケジュール',
            'view'=> 'スケジュールを見る'
        ],
        'exams'=> 'Exams',
        'feedbacks'=> 'フィードバック',
        'certificates' => '証明書',
        'general'=> '一般クラス',
        'inquiries'=> [
            'index'=> '問い合わせ',
            'view'=> '問い合わせ'
        ],
        'login'=> 'Login',
        'users'=> [
            'index'=> 'ユーザー管理',
            'view'=> 'ユーザー'
        ],
        'settings'=> '設定',
        'nft'=> 'エヌエフティー',
        'translations'=> '翻訳',
        'password'=> [
            'update'=> 'パスワード更新'
        ],
        'top_page'=> 'LE Bazaar にようこそ',
        'refunds' => '返金管理',
    ],
    'filters'=> [
        'status'=> [
            'active'=> '有効',
            'approved'=> '承認されました',
            'denied'=> '拒否されました',
            'disabled'=> '無効',
            'pending'=> '保留'
        ],
        'bookings'=> [
            'desc'=> '予約数（多い順）',
            'asc'=> '予約数（少ない順）'
        ],
        'schedule'=> [
            'asc'=> '日付（昇順）',
            'desc'=> '日付（降順）'
        ],
        'date'=> [
            'desc'=> '日付（新しい順）',
            'asc'=> '日付（古い順）'
        ],
        'name'=> [
            'asc'=> '名前 A-Z',
            'desc'=> '名前 Z-A'
        ],
        'price'=> [
            'desc'=> 'ポイント（高い順）',
            'asc'=> 'ポイント（低い順）'
        ],
        'rating'=> [
            'desc'=> '評価（高い順）',
            'asc'=> '評価（低い順）'
        ],
        'title'=> [
            'asc'=> 'タイトル（昇順）',
            'desc'=> 'タイトル（降順）'
        ]
    ],
    'certification'=> [
        'awarded_at'=> '日付',
        'awarded_by'=> '授賞',
        'certificate_title'=> 'タイトル'
    ],
    'work'=> [
        'company'=> '所属、大学、会社',
        'description'=> '概要',
        'position'=> '役職',
        'history'=> '職歴'
    ],
    'education'=> [
        'degree'=> '学位',
        'background'=> '学歴',
        'school'=> '学校'
    ],
    'user'=> [
        'about'=> '内容',
        'university'=> '学校／大学',
        'specialty'=> '専門'
    ],
    'class_schedule'=> [
        'end_date'=> '終了日',
        'class_style'=> 'オンデマンド／ライブ',
        'start_date'=> '開始日',
        'number_users_booked'=> 'ユーザーは予約されました'
    ],
    'top_page'=> [
        'description'=> 'すべての人に学びの機会を'
    ],
    'wallet_history'=> [
        'id'=> 'トランザクションID',
        'type'=> '取引タイプ'
    ],
    'texts'=> [
        'actions'=> '実行',
        'ada' =>'エイダ',
        'ada_unavailable' => 'ADA価格は利用できません',
        'stripe_unavailable' => 'クレジットカード決済は一時的にご利用いただけません',
        'add_choice'=> '選択追加',
        'add_item'=> '項目を追加',
        'add_points'=> 'ポイント追加',
        'admin'=> '管理者',
        'all'=> '全て',
        'application_submitted'=> '申込み送信済み',
        'approve'=> '承認',
        'attend'=> '参加',
        'attend_class'=> 'クラスに参加',
        'live_class_description'=> 'クリックしてクラスに参加する',
        'back'=> '戻る',
        'back_to_class'=> 'クラスに戻る',
        'back_to_sign_in'=> 'サインインに戻る',
        'back_to_top'=> 'トップページに戻る',
        'badge_name'=> 'バッジ 名',
        'badges'=> 'バッジ',
        'badges_claimed'=> '獲得バッジ申請',
        'basic_information'=> '基本情報',
        'book'=> '予約',
        'book_class'=> '予約',
        'wallet_book_details'=> '予約したクラス',
        'booked_date'=> '予約日付',
        'browse_classes'=> 'クラス検索',
        'cancel'=> 'キャンセル',
        'cancel_class_booking'=> '予約キャンセル',
        'cancellable'=> 'キャンセル可能',
        'category'=> 'カテゴリー',
        'categories' => 'カテゴリー',
        'certification'=> '授賞',
        'certificates' => '証明書',
        'certificate' => '証明書',
        'certificate_status' => '証明書ステータス',
        'eligible' => '適格',
        'minted' => '発行済み',
        'failed' => '失敗',
        'no_certificates' => 'まだ証明書がありません',
        'complete_courses_hint' => '証明書が有効なコースを完了してNFT証明書を取得しましょう',
        'view_on_explorer' => 'エクスプローラーで取引を確認する',
        'minting_in_progress' => '発行中...',
        'awaiting_mint' => '講師による証明書の発行を待っています',
        'minting_failed' => '発行に失敗しました。講師にお問い合わせください',
        'completion_certificate' => '修了証明書',
        'certificate_eligible' => 'NFT証明書はまもなく講師によって発行されます！',
        'certificate_minting' => 'あなたの証明書がCardanoブロックチェーン上で発行されています...',
        'certificate_minted' => '証明書が正常に発行されました！',
        'certificate_failed' => '証明書の発行に失敗しました。講師にお問い合わせください。',
        'minted_on' => '発行日',
        'total_certificates' => '証明書合計',
        'instructor' => '講師',
        'completed' => '完了',
        'mint' => '発行',
        'minting' => '発行中',
        'minting_all' => '全て発行中...',
        'mint_all_eligible' => '対象者全員を発行',
        'retry' => '再試行',
        'student' => '生徒',
        'completed_date' => '完了日',
        'transaction' => 'トランザクション',
        'view_transaction' => 'トランザクションを見る',
        'change_password'=> 'パスワード変更',
        'check_schedules'=> 'スケジュール確認',
        'choice'=> '選択',
        'choose_role'=> '選択してください。生徒／講師',
        'claim_all'=> 'すべて受け取る',
        'class'=> 'クラス',
        'class_history'=> 'クラス参加履歴',
        'class_image'=> 'クラスイメージ',
        'class_information'=> 'クラス情報',
        'class_name'=> 'クラス名',
        'class_type'=> 'クラスタイプ',
        'classes'=> 'クラス',
        'classes_booked'=> 'クラス予約済',
        'classification'=> '区分',
        'clear' => 'クリア',
        'coming_soon'=> '近日公開予定',
        'commission_rate'=> '手数料率',
        'complete'=> '終了',
        'complete_class'=> 'クラス受講終了',
        'complete_classes_earn_badge'=> 'これらのクラスをクリアするとバッジを獲得できます',
        'complete_class_earn_badge'=> 'このクラスをクリアしてバッジを獲得',
        'confirm'=> '確認',
        'confirm_password'=> 'パスワードの確認',
        'complete_class_description'=> 'おめでとうございます。クラス受講完了です',
        'reward_notification_cert_only'  => '「:course」の受講おめでとうございます！NFT証明書を受け取る資格があります。リワードページでご確認ください。',
        'reward_notification_token_only' => '「:course」の受講おめでとうございます！トークンリワードを受け取る資格があります。リワードページでご確認ください。',
        'reward_notification_both'       => '「:course」の受講おめでとうございます！NFT証明書とトークンリワードを受け取る資格があります。リワードページでご確認ください。',
        'content'=> '内容',
        'content_information'=> '内容詳細',
        'correct_value'=> '正解',
        'country'=> '国',
        'course'=> 'コース',
        'create_account'=> 'アカウント作成はこちら',
        'create_category'=> 'カテゴリー作成',
        'create_classification'=> '区分作成',
        'create_exam'=> 'Exam作成',
        'create_nft'=> 'NFTを作成する',
        'create_package'=> 'パッケージ作成',
        'current_password'=> '現在のPassword',
        'date'=> '日付',
        'date_applied'=> '申請日',
        'date_approved'=> '承認日',
        'date_created'=> '作成日',
        'date_denied'=> '否認日',
        'date_joined'=> '参加日',
        'days'=> '日',
        'days_before_cancellation'=> 'キャンセル可能日付',
        'delete'=> '消去',
        'delete_category'=> 'カテゴリー消去',
        'delete_class'=> 'クラス消去',
        'delete_classification'=> '分類消去',
        'delete_nft'=> 'NFTの削除',
        'delete_schedule'=> 'スケジュール消去',
        'deny'=> '拒否',
        'description'=> '概要',
        'disable'=> '無効',
        'done_watching'=> '視聴完了',
        'wallet_earn_details'=> 'クラスで獲得',
        'edit'=> '修正',
        'edit_category'=> '区分修正',
        'edit_class'=> 'クラス修正',
        'edit_classification'=> '区分の編集',
        'edit_exam'=> 'Exam修正',
        'edit_nft'=> 'NFTの編集',
        'edit_profile'=> 'Profile修正',
        'education'=> '学歴',
        'email'=> 'Eメール',
        'enable'=> '有効化',
        'update_password_help'=> '確認のため現在のパスワードを入力してください',
        'exam_name'=> '試験名',
        'exchange_badges'=> 'バッジ交換',
        'exchange_points'=> 'ポイント交換',
        'export_csv'=> 'CSVエクスポート',
        'export_items'=> 'エクスポート項目',
        'featured_classes'=> '新しいクラス',
        'featured_teachers'=> '新しい先生',
        'feed_points' => 'ポイント追加',
        'filter'=> 'フィルター',
        'first_name'=> '名',
        'for_sale' => '販売中',
        'forgot_password'=> 'パスワード忘れ',
        'format'=> '受講タイプ',
        'free'=> 'フリークラス',
        'frequency'=> '開催頻度',
        'from'=> '差出人',
        'fully_booked'=> '満員御礼',
        'general_information'=> '基本情報',
        'give_feedback'=> 'フィードバック',
        'home'=> 'ホーム',
        'image_url'=> '画像のURL',
        'keyword'=> 'キーワード',
        'language'=> '言語',
        'last_name'=> '姓',
        'length'=> '長さ',
        'give_feedback_description'=> 'このクラスの感想を教えてください',
        'live'=> 'ライブ',
        'live_class'=> 'ライブクラス',
        'load_more'=> '続き',
        'mark_done'=> '終了印',
        'message'=> 'メッセージ',
        'mobile' => 'モバイルウォレットブラウザ',
        'inquiry_help'=> '200字以内',
        'password_help'=> '8文字以上にする必要があります',
        'mypage'=> 'My Page',
        'name'=> '名前',
        'new_category'=> '新しいカテゴリ',
        'new_password'=> '新パスワード',
        'next_question'=> '次の質問',
        'nft_select' => 'NFTを選択する',
        'nft' => 'エヌエフティー',
        'nft_verify' => 'NFTの所有権を確認するためウォレットで署名してください',
        'no_file_selected'=> 'ファイルが選択されていません',
        'no_records_found'=> 'レコードがありません',
        'certificates_not_enabled' => 'このコースでは証明書が有効になっていません。コース設定で有効にして、受講完了証明書を発行してください。',
        'no_students' => 'まだこのコースに登録した生徒はいません。',
        'no_eligible_students' => '現在、証明書の対象となる生徒はいません。生徒がコースを修了し、全ての試験に合格する必要があります。',
        'airdrop_fee_title'          => 'エアドロップ費用見積もり',
        'estimating_fee'             => '手数料を見積もっています...',
        'students_selected'          => '選択された生徒数',
        'students_selected_of'       => '{total}名中{selected}名の対象生徒を選択中',
        'fee_per_student'            => '生徒1人あたりのコスト',
        'total_fee'                  => '合計見積もりコスト',
        'wallet_balance_label'       => 'ウォレット残高',
        'insufficient_funds_detail'  => '残高が不足しています。あと₳{shortfall}必要です。',
        'confirm_airdrop'            => 'エアドロップを確認',
        'airdrop_results_title'      => 'エアドロップ結果',
        'airdrop_success_count'      => '{count}件の証明書が正常にエアドロップされました。',
        'airdrop_failed_count'       => '{count}件のエアドロップが失敗しました。',
        'failed_students'            => '失敗した生徒：',
        'retry_failed'               => '失敗した生徒を再試行',
        'no_results'                 => '表示する結果がありません。',
        'unknown_error'              => '不明なエラー',
        'connect_wallet_to_airdrop'  => '証明書をエアドロップするにはウォレットを接続してください',
        'no_rewards_configured'      => 'このコースに報酬が設定されていません。コース設定で証明書またはトークン報酬を有効にしてください。',
        'no_schedules_available'=> 'スケジュールがありません',
        'on_demand'=> 'オンデマンド',
        'overall_rating'=> 'レート',
        'package'=> 'パッケージ',
        'package_information'=> 'パッケージ情報',
        'password'=> 'パスワード',
        'pay'=> '支払う',
        'points'=> 'ポイント',
        'wallet_commission_details'=> 'コミッション',
        'points_earned'=> 'エイダ追加',
        'wallet_connect'=> 'ウォレットを接続する',
        'wallet_connected' => '接続済み',
        'wallet_not_connected' => 'ウォレットのDAppコネクタが有効になっていることを確認してください',
        'wallet_exchange_details'=> 'NFT変更ポイント',
        'wallet_feed_details'=> 'Walletに追加されたポイント',
        'wallet_id' => 'Wallet ID',
        'wallet_message' => 'ウォレットを確認するために署名してください',
        'wallet_switch' => '接続ウォレットの切替',
        'wallet_verify' => 'ウォレット所有権の確認',
        'wallet_verify_error' => 'ウォレットを確認できません',
        'wallet_purchase_details' => 'コース購入',
        'buy_with_ada' => 'ADAで購入',
        'building_transaction' => 'トランザクション構築中...',
        'sign_in_wallet' => 'ウォレットで署名してください',
        'submitting_transaction' => 'ブロックチェーンに送信中...',
        'payment_pending' => 'ADAのお支払いはブロックチェーン上で確認中です。',
        'payment_confirmed' => '支払い確認済み',
        'points_to_convert_to_nft'=> 'ポイントNFT変換',
        'price'=> 'ポイント',
        'price_locked_hint'=> '価格はクラス申請時に設定され、コミュニティ承認後は変更できません。',
        'pricing_information'=> 'ポイント上布',
        'processing'=> '処理中',
        'profile'=> 'プロファイル',
        'question'=> '質問',
        'rating'=> '評価',
        'recommended_size'=> '標準サイズ',
        'redirect_to_live_class'=> '授業にアクセス',
        'wallet_refund_details'=> 'ポイント返却',
        'role'=> '生徒／先生',
        'save_changes'=> '変更を保存',
        'score'=> 'Score',
        'search'=> '検索',
        'search_class_name'=> '検索クラス名',
        'search_name'=> '検索',
        'search_name_email'=> '名前またはEmail検索',
        'search_name_email_subject'=> '名前、Emailまたは主題検索',
        'search_title'=> 'タイトル検索',
        'search_title_teacher'=> 'タイトルまたは講師名検索',
        'seats'=> '座',
        'seats_available'=> '有効座席数',
        'send_reply'=> '返信を送る',
        'send_request'=> 'リクエストを送る',
        'sign_in'=> 'Sign In',
        'sign_out'=> 'Sign Out',
        'sign_up'=> 'Sign up',
        'sort'=> '並べ替え',
        'status'=> 'Status',
        'status_information'=> '状況情報',
        'sign_up_student'=> '生徒 Sign Up',
        'students'=> '生徒',
        'subject'=> '課目',
        'submit'=> '提出',
        'take_exam'=> 'Exam',
        'take_exam_description'=> '受講確認Exam',
        'teacher'=> '講師',
        'teacher_information'=> '講師情報',
        'sign_up_teacher'=> '講師Sign Up',
        'teachers'=> '講師',
        'teaching_history'=> '教育履歴',
        'application_submitted_description'=> '申請処理中です。処理後メールが届きます',
        'title'=> 'タイトル',
        'to'=> 'To',
        'to_convert_to_nft'=> 'NFT変換',
        'total_badges'=> 'バッジ総数',
        'total_items'=> '項目総数',
        'total_points'=> 'ポイント総数',
        'transaction_date'=> '取引日',
        'type'=> 'タイプ',
        'update_password'=> 'パスワード更新',
        'update_profile'=> 'プロファイル更新',
        'upload'=> 'アップロード',
        'video'=> 'ビデオ',
        'view'=> '見る',
        'view_more'=> 'もっと見る',
        'view_profile'=> 'プロファイルを見る',
        'wallet_balance'=> 'ウォレット残高',
        'wallet_hardware' => 'ハードウェアウォレット',
        'wallet_history'=> 'ウォレット履歴',
        'watch_video_description'=> 'このクラスで得られる内容',
        'watch_video'=> 'ビデオを見る',
        'welcome'=> 'ようこそ',
        'work'=> '職歴',
        'update_password_notice'=> 'パスワードを更新するとサインアウトされます',
        'temporary_password_notice'=> 'パスワードは一時的なものです。安全のためパスワードを更新してください。',
        'class_url'=> 'クラスリンク',
        'wallet_schedule_fee' => 'クラスのスケジュール予約にポイントを使用',
        'schedule_fee_note' => 'フリークラスはスケジュールごとにポイントが必要です。必要ポイント数：',
        'class_feedback' => 'クラスフィードバック',
        'comments' => 'コメント',
        'complete_class_confirmation_message' => '私たちのクラスをお楽しみいただけましたら、より良いオンライン学習体験を提供するための活動を支援していただけると大変嬉しく思います。ご支援をお待ちしております。',
        'donate_points' => 'ポイントを寄付する',
        'wallet_donate_points_from' => '寄付ポイントの受取元：',
        'wallet_donate_points_to' => '寄付ポイントの送信先：',
        'exam_passed' => '試験に合格おめでとうございます！',
        'exam_failed' => '残念ながら、試験に合格できませんでした。「再受験をリクエスト」をクリックして再受験をリクエストできます。',
        'request_retake' => '再受験をリクエスト',
        'exam_passing_percentage' => '試験合格パーセンテージは',
        'payment_details' => '支払い詳細',
        'payment_amount' => '金額',
        'complete_payment' => '支払いを完了する',
        'pay_with_card' => 'クレジットカードで支払う',
        'payment_successful' => '支払いが完了しました！',
        'payment_cancelled' => '支払いがキャンセルされました',
        'enrollment_confirmed' => 'コースへの登録が確認されました。',
        'payment_not_processed' => '支払いは処理されませんでした。',
        'verifying_payment' => '支払いを確認中...',
        'amount_paid' => '支払い金額',
        'receipt_sent' => '領収書がメールで送信されました。',
        'view_receipt' => '領収書を表示',
        'my_courses' => 'マイコース',
        'view_course' => 'コースを表示',
        'payment_help' => '問題が発生した場合は、再度お試しいただくか、サポートにお問い合わせください。',
        'try_again' => '再試行',
        'payment_failed' => '支払いに失敗しました。再度お試しください。',
        'purchases_unavailable' => 'ご購入は現在一時的にご利用いただけません。後ほど再度お試しください。',
        'teacher_view_label' => '講師ビュー — 料金プレビューのみ',
        'purchase_history' => '購入履歴',
        'payment_method' => '支払い方法',
        'credit_card' => 'クレジットカード',
        'no_purchases' => 'まだクラスを購入していません。',
        'transaction_reference' => '参照',
        'status_confirmed' => '確認済み',
        'status_pending' => '保留中',
        'status_failed' => '失敗',
        'status_refunded' => '返金済み',
        'status_succeeded' => '成功',
        'status_canceled' => 'キャンセル',
        'reward_settings'              => 'リワード設定',
        'certificate_reward_enabled'   => 'NFT証明書リワード',
        'certificate_name'             => '証明書名',
        'certificate_description'      => '証明書の説明',
        'certificate_image_url'        => '証明書画像URL',
        'token_reward_enabled'         => 'トークンリワード',
        'token_reward_amount'          => 'トークン数量',
        'token_reward_amount_hint'     => 'コース修了時に付与するトークンの数量（最大1,000,000）',
        'payment_confirmations' => ':current/:required 承認済み',
        'payment_confirmed_auto' => '支払いが確認されました！再読み込み中...',
        'payment_failed_retry' => 'ブロックチェーン上で支払いに失敗しました。再度お試しください。',
        'wallet_disconnected_pending' => 'ウォレットが切断されましたが、ブロックチェーン上で保留中のトランザクションは引き続き追跡されています。再接続して監視を続けることができます。',
        'wallet_reconnect_prompt' => 'ウォレットが切断されました。続けるにはウォレットを再接続してください。',
        'wallet_reconnect_button' => '再接続',
        'cardano_network_degraded' => 'Cardanoネットワークは遅延が発生しています。取引に時間がかかる場合があります。クレジットカードでのお支払いをお勧めします。',
        'cardano_network_unreachable' => 'Cardanoネットワークは現在利用できません。ADA支払いは一時的に無効です。クレジットカードでお支払いください。',
        'total_rewards'                 => '報酬合計',
        'reward_type'                   => '報酬タイプ',
        'reward_type_certificate'       => '証明書',
        'reward_type_token'             => 'トークン',
        'reward_amount'                 => '数量',
        'delivery_status'               => '配布ステータス',
        'delivery_date'                 => '配布日',
        'wallet_destination'            => 'ウォレット',
        'wallet_external'               => '外部ウォレット',
        'wallet_custodial'              => 'カストディアルウォレット',
        'status_delivered'              => '配布済み',
        'status_revoked'                => '取り消し済み',
        'status_eligible'               => '対象',
        'no_rewards'                    => 'まだ報酬がありません',
        'complete_courses_rewards_hint' => '報酬が有効なコースを修了してNFT証明書とトークンを獲得しましょう',
        'reward_detail_title'           => '報酬詳細',
        'nft_name'                      => 'NFT名',
        'nft_description'               => 'NFTの説明',
        'on_chain_reference'            => 'オンチェーン参照',
        'view_on_explorer'              => 'エクスプローラーで確認する',
    ],
    'refund' => [
        'stripe_success' => 'Stripe決済が正常に返金されました。',
        'ada_success' => 'ADA返金トランザクションが送信されました。',
        'has_rewards_warning' => 'この学生はコースの報酬を獲得しています。force=trueを指定して続行してください。',
        'has_rewards_warning_title' => '学生が報酬を取得済み',
        'has_rewards_warning_body' => 'この学生はすでにこのコースの報酬（NFT証明書またはトークン）を取得しています。続行すると報酬が無効になります。強制返金しますか？',
        'force_refund' => '強制返金',
        'already_refunded' => 'この決済はすでに返金済みです。',
        'not_refundable' => '確認済みまたは成功した決済のみ返金できます。',
        'chargeback_logged' => 'チャージバックが記録され、コースへのアクセスが取り消されました。',
    ],
    'tx' => [
        'success' => [
            'status' => 'トランザクション成功！',
            'message' => 'ブロックチェーン上で5回の承認をお待ちください'
        ],
        'error' => [
            'message' => 'トランザクションを送信できませんでした'
        ]
    ],
    'wallets' => [
        'eternl' => 'Eternl',
        'flint'  => 'Flint',
        'nami'   => 'Nami',
    ]
];
