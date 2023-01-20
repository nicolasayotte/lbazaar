import { Button } from "@mui/material"
import { Link } from "@inertiajs/inertia-react"

const BackButton = (props) => {

    const getQuery = (q) => {
        return (window.location.search.match(new RegExp('[?&]' + q + '=([^&]+)')) || [, null])[1];
    }

    if (props.processing != undefined) {
        return (
            <Link href={getQuery('returnUrl')}>
                <Button disabled={props.processing}>Back</Button>
            </Link>
        )
    }

    return (
        <Link href={getQuery('returnUrl')}>
            <Button>Back</Button>
        </Link>
    )
}

export default BackButton
