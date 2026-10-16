const express = require("express");
const router = express.Router();

const {
    createEvent,
    getAllEvents,
    getEventById,
    registerForEvent,
    cancelRegistration,
    updateEvent,
    deleteEvent,
    getMyRegistrations,
    getMyEvents,
    getEventAttendees
} = require("../controller/event.controller");

const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");


router.get("/", getAllEvents);
router.get("/my-registrations", verifyToken, getMyRegistrations);  // /:id se PEHLE
router.get("/my-events", verifyToken, verifyAdmin, getMyEvents);
router.get("/:id", getEventById);
router.get("/:id/attendees", verifyToken, verifyAdmin, getEventAttendees);
router.post("/:id/register", verifyToken, registerForEvent);
router.post("/:id/cancel", verifyToken, cancelRegistration);
router.post("/", verifyToken, verifyAdmin, createEvent);
router.put("/:id", verifyToken, verifyAdmin, updateEvent);
router.delete("/:id", verifyToken, verifyAdmin, deleteEvent);

module.exports = router;