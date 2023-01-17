import data from "../routes.json"

export const getRoute = (routename, params, request = {}) => {
    var routeValue = data[routename]
    var requestUrl = ''
    for (const key in params) {
        routeValue = routeValue.replace(`{${key}}`, params[key]);
    }

    if (request != {}) {

        var index = 0;
        for (const key in request) {
            requestUrl = (index > 0 ? '&' : '?' ) + requestUrl + `${key}=${request[key]}`;
            index++
        }
    }

    return routeValue + requestUrl;
}

export default data
