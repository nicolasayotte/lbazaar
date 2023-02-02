import { Link } from "@inertiajs/inertia-react"
import { Language } from "@mui/icons-material"
import { Stack, Toolbar, Typography } from "@mui/material"
import { getRoute } from "../../helpers/routes.helper"

const LanguageNavbar = ({ locale }) => {

    const languages = {
        en: { name: 'English', value: 'en' },
        ja: { name: 'Japanese', value: 'ja' }
    }

    const LanguageButton = ({ language }) => {

        if (language.value === locale) {
            return <span style={{ color: 'white' }} children={language.name} />
        }

        return (
            <Link
                children={language.name}
                href={getRoute('language.set', { locale: language.value })}
                style={{
                    color: locale === language.value ? 'white' : 'inherit'
                }}
            />
        )
    }

    return (
        <Toolbar variant="dense" sx={{ minHeight: 'unset', py: 1, backgroundColor: '#444' }}>
            <Stack
                direction="row"
                marginLeft="auto"
                spacing={1}
                alignItems="center"
                fontSize="small"
                color="GrayText"
            >
                <Language sx={{ color: 'white' }} />
                <LanguageButton language={languages.en} />
                <Typography fontSize="inherit" children="/" />
                <LanguageButton language={languages.ja} />
            </Stack>
        </Toolbar>
    )
}

export default LanguageNavbar
