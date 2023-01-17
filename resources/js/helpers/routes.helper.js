import data from "../routes.json"

const routes = data

export const getRoute = (routename, params) => {
    var routeValue = data[routename]
    for (const key in params) {
        routeValue = routeValue.replace(`{${key}}`, params[key]);
    }
    return routeValue;
}

export default routes
