export default async function getView(isLogged, path) {
    if (path.subPath === '/' && !isLogged)
        return {status: 303, redirect: "/pages/login/login"};
    const user = path.subPath === '/' ?  : path.subPath.substring(1);
}