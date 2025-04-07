import Path from '/static/js/utils/Path.js';
import getProfileHeaderSection from './headerSection.js';
import getMatchHistorySection from './matchHistorySection.js';
import getStatsSection from './statsSection.js';
import ViewScope from '/static/js/utils/ViewScope.js';

export default async function getView(isLogged, path) {
    // Redirect to login if not logged in and trying to access the main profile page
    if (!isLogged && path.subPath === '/') {
        return { status: 300, redirect: "/login/login" };
    }

    const css = [
        Path.css('main/profile.css'),
    ];
    const component = document.createElement('div');

    // get profile data and match history data from the API
    let profileData, matchHistoryData, statsData;
    try {
        [profileData, matchHistoryData, statsData] = await Promise.all([
            ViewScope.request('GET', `${Path.API.PROFILE}${path.subPath}`, {disableCatch: true}),
            ViewScope.request('GET', `${Path.API.MATCH_HISTORY}${path.subPath}?offset=0&limit=10`, {disableCatch: true}),
            ViewScope.request('GET', `${Path.API.STATS}${path.subPath}`, {disableCatch: true}),
        ]);
    } catch (error) {
        console.error("Profile page load error:", error);
        return {status: 500, error: "An error occurred while fetching data."};
    }
    if (profileData.status !== 200)
        return {status: profileData.status, error: profileData.data.error};
    if (matchHistoryData.status !== 200)
        return {status: matchHistoryData.status, error: matchHistoryData.data.error};
    if (statsData.status !== 200)
        return {status: statsData.status, error: statsData.data.error};
    const profile = profileData.data;
    const matchHistory = matchHistoryData.data.matches;
    const stats = statsData.data;

    // Add all the elements to the component
    component.append(getProfileHeaderSection(profile));
    component.append(getStatsSection(profile, stats, matchHistory));
    component.append(getMatchHistorySection(profile, matchHistory, path));

    return { status: 200, component, css };
}