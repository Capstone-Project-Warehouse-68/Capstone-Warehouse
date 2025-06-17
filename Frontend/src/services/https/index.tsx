// import axios, { AxiosError } from "axios";

const apiUrl = "https://api.nextsut.site";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");

const requestOptions = {
    headers: {
        "Content-Type": "application/json",
        Authorization: `${Bearer} ${Authorization}`,
    },

};


export {
    // api
};
