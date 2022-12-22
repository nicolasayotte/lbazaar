import data from "../routes.json"

export const getRoute = (routename, params) => {
    var routeValue = data[routename]
    for (const key in params) {
        routeValue = routeValue.replace(`{${key}}`, params[key]);
    }
    return routeValue;
}

export default data
