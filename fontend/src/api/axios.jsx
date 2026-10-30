import axios from "axios"

const api=axios.create({
    baseURL: "https://eventhub-fngm.onrender.com/api",
    withCredentials:true,
})
export default api;


















