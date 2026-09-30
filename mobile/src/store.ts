// A simple in-memory store to hold the user data after login/signup
export let globalUser: any = null;

export const setGlobalUser = (user: any) => {
    globalUser = user;
};
