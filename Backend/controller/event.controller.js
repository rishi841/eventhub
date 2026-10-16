const EventModel = require("../models/Event.model");
const RegistrationModel = require("../models/Registration.model");

const createEvent = async (req, res) => {
    try {
        const { title, description, date, venue, capacity } = req.body;

        if (!title || !description || !date || !venue || !capacity) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const newEvent = await EventModel.create({
            title,
            description,
            date,
            venue,
            capacity,
            createdBy: req.user.id   // comes from verifyToken middleware
        });

        return res.status(201).json({
            message: "Event created successfully",
            event: newEvent
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};
const getAllEvents = async (req, res) => {
    try {
        const events = await EventModel.find().sort({ date: 1 });

        return res.status(200).json({
            message: "Events fetched successfully",
            events
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await EventModel.findById(id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        return res.status(200).json({
            message: "Event fetched successfully",
            event
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};
const registerForEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { phone, college, year, reason } = req.body || {};

        // 1. Form validation
        if (!phone || !college || !year) {
            return res.status(400).json({
                message: "Phone, college aur year zaroori hain"
            });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                message: "Phone number 10 digit ka hona chahiye"
            });
        }

        const event = await EventModel.findById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // 2. Duplicate check
        const alreadyRegistered = event.registeredUsers.includes(userId);
        const alreadyWaitlisted = event.waitlist.includes(userId);

        if (alreadyRegistered || alreadyWaitlisted) {
            return res.status(400).json({
                message: "You have already registered for this event"
            });
        }

        // 3. Capacity logic
        let status;
        if (event.registeredUsers.length < event.capacity) {
            event.registeredUsers.push(userId);
            status = "registered";
        } else {
            event.waitlist.push(userId);
            status = "waitlisted";
        }
        await event.save();

        // 4. Form data alag collection mein save
        await RegistrationModel.create({
            event: id,
            user: userId,
            phone,
            college,
            year,
            reason
        });

        return res.status(200).json({
            message: status === "registered"
                ? "Registered successfully"
                : "Event full. You've been added to the waitlist",
            status
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
const cancelRegistration = async (req, res) => {
    try {
        const { id } = req.params;      
        const userId = req.user.id;

        const event = await EventModel.findById(id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        const wasRegistered = event.registeredUsers.includes(userId);
        const wasWaitlisted = event.waitlist.includes(userId);

        if (!wasRegistered && !wasWaitlisted) {
            return res.status(400).json({
                message: "You are not registered for this event"
            });
        }

        if (wasRegistered) {
            
            event.registeredUsers = event.registeredUsers.filter(
                (uId) => uId.toString() !== userId
            );

            
            if (event.waitlist.length > 0) {
                const promotedUserId = event.waitlist.shift(); 
                event.registeredUsers.push(promotedUserId);
            }
        } else if (wasWaitlisted) {
            
            event.waitlist = event.waitlist.filter(
                (uId) => uId.toString() !== userId
            );
        }
        await RegistrationModel.deleteOne({ event: id, user: userId });

        await event.save();

        return res.status(200).json({
            message: "Registration cancelled successfully"
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const event = await EventModel.findById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.createdBy.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to edit this event"
            });
        }

        const { title, description, date, venue, capacity } = req.body || {};

        if (capacity !== undefined && capacity !== "") {
            const newCapacity = Number(capacity);

            if (!Number.isInteger(newCapacity) || newCapacity < 1) {
                return res.status(400).json({
                    message: "Capacity 1 ya usse zyada honi chahiye"
                });
            }

            if (newCapacity < event.registeredUsers.length) {
                return res.status(400).json({
                    message: `${event.registeredUsers.length} log already registered hain, capacity usse kam nahi ho sakti`
                });
            }

            event.capacity = newCapacity;
        }

        if (title) event.title = title;
        if (description) event.description = description;
        if (date) event.date = date;
        if (venue) event.venue = venue;

        // jitni seats khaali hain, utne waitlist wale auto-promote
        while (
            event.registeredUsers.length < event.capacity &&
            event.waitlist.length > 0
        ) {
            event.registeredUsers.push(event.waitlist.shift());
        }

        await event.save();

        return res.status(200).json({
            message: "Event updated successfully",
            event
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const event = await EventModel.findById(id);
        

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

     
        if (event.createdBy.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this event"
            });
        }

        await EventModel.findByIdAndDelete(id);
        await RegistrationModel.deleteMany({ event: id });

        return res.status(200).json({
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};
const getMyRegistrations = async (req, res) => {
    try {
        const userId = req.user.id;

        const registered = await EventModel.find({ registeredUsers: userId }).sort({ date: 1 });
        const waitlistedEvents = await EventModel.find({ waitlist: userId }).sort({ date: 1 });

        const waitlisted = waitlistedEvents.map((event) => {
            const position =
                event.waitlist.findIndex((id) => id.toString() === userId) + 1;
            return { ...event.toObject(), position };
        });

        return res.status(200).json({ registered, waitlisted });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const getMyEvents = async (req, res) => {
    try {
        const events = await EventModel.find({ createdBy: req.user.id }).sort({ date: 1 });

        return res.status(200).json({ events });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


const getEventAttendees = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await EventModel.findById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to view these attendees"
            });
        }

        const registrations = await RegistrationModel.find({ event: id })
            .populate("user", "Name email");

        // userId -> registration data ka lookup banao
        const lookup = {};
        registrations.forEach((r) => {
            if (r.user) lookup[r.user._id.toString()] = r;
        });

        const format = (userId) => {
            const r = lookup[userId.toString()];
            if (!r) return null;
            return {
                name: r.user.Name,
                email: r.user.email,
                phone: r.phone,
                college: r.college,
                year: r.year,
                reason: r.reason,
            };
        };

        // event ke arrays ka order hi final order hai (waitlist ki line bhi wahi)
        const registered = event.registeredUsers.map(format).filter(Boolean);
        const waitlisted = event.waitlist.map(format).filter(Boolean);

        return res.status(200).json({ registered, waitlisted });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    registerForEvent,
    cancelRegistration,
    updateEvent,
    deleteEvent,
    getMyRegistrations,
    getEventAttendees,
    getMyEvents
};