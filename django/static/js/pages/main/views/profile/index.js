import Path from '/static/js/utils/Path.js';
import fetchProfileData from './fetchProfileData.js';
import fetchMatchHistory from './fetchMatchHistory.js';
import fetchStats from './fetchStats.js';
import getProfileHeaderSection from './headerSection.js';
import getMatchHistorySection from './matchHistorySection.js';
import getStatsSection from './statsSection.js';


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
    const [profileData, matchHistoryData, statsData] = await Promise.all([
        fetchProfileData(path.subPath),
        fetchMatchHistory(path.subPath, 0, 10),
        fetchStats(path.subPath),
    ]);
    if (profileData.status && profileData.status !== 200)
        return {status: profileData.status, error: profileData.error};
    if (matchHistoryData.status && matchHistoryData.status !== 200)
        return {status: matchHistoryData.status, error: matchHistoryData.error};
    if (statsData.status && statsData.status !== 200)
        return {status: statsData.status, error: statsData.error};
    const profile = profileData.data;
    const matchHistory = matchHistoryData.data.matches;
    const stats = statsData.data;

    // Add all the elements to the component
    component.append(getProfileHeaderSection(profile));
    component.append(getStatsSection(profile, stats, matchHistory));
    component.append(getMatchHistorySection(profile, matchHistory, path));

    return { status: 200, component, css };
}