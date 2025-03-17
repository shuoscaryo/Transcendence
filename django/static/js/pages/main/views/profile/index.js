import Path from '/static/js/utils/Path.js';
import fetchProfileData from '/static/js/utils/api/fetchProfileData.js';
import fetchMatchHistory from '/static/js/utils/api/fetchMatchHistory.js';

import getProfileHeaderSection from './headerSection.js';
import getMatchHistorySection from './matchHistorySection.js';
import getStatsSection from './statsSection.js';


export default async function getView(isLogged, path) {
    // Redirect to login if not logged in and trying to access the main profile page
    if (!isLogged && path.subPath === '/') {
        return { status: 300, redirect: "/pages/login/login" };
    }

    const css = [
        Path.css('main/profile.css'),
    ];
    const component = document.createElement('div');

    // Fetch profile data and match history data from the API
    const [profileData, matchHistoryData] = await Promise.all([
        fetchProfileData(path.subPath),
        fetchMatchHistory(path.subPath, 0, 10)
    ]);
    if (profileData.status && profileData.status !== 200)
        return {status: profileData.status, error: profileData.error};
    if (matchHistoryData.status && matchHistoryData.status !== 200)
        return {status: matchHistoryData.status, error: matchHistoryData.error};
    const profile = profileData.data;
    const matchHistory = matchHistoryData.data.matches;

    // Add all the elements to the component
    component.append(getProfileHeaderSection(profile));
    component.append(getStatsSection(profile));
    component.append(getMatchHistorySection(profile, matchHistory, path));

    return { status: 200, component, css };
}