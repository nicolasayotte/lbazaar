import { Head, usePage } from "@inertiajs/inertia-react"

const Meta = ({ titleProps = '' }) => {

    const { title, description, author, keywords } = usePage().props

    return (
        <Head>
            <title children={titleProps || title} />
            {
                description &&
                <meta head-key="description" name="description" content={description} />
            }
            {
                author &&
                <meta head-key="author" name="author" content={author} />
            }
            {
                keywords &&
                <meta head-key="keywords" name="keywords" content={keywords} />
            }
        </Head>
    )
}

export default Meta
