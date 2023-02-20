import { usePage } from "@inertiajs/inertia-react"

const Schedules = () => {

    const { schedules } = usePage().props

    console.log(schedules)

    return (
        <>Schedules</>
    )
}

export default Schedules
