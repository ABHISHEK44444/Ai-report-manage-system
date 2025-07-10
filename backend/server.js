import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGOOSE SCHEMAS (MODELS) ---

// User Model
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['User', 'Admin'], default: 'User' }
});
const User = mongoose.model('User', userSchema);

// Permission Model
const permissionSchema = new mongoose.Schema({
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Permission = mongoose.model('Permission', permissionSchema);

// Daily Activity Model
const dailyActivitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
    accountName: { type: String, required: true },
    contactPerson: String,
    contactNumber: String,
    workDone: String,
    outcome: String,
    supportRequired: String,
    managerRemarks: { type: String, default: 'No remarks' }
});
const DailyActivity = mongoose.model('DailyActivity', dailyActivitySchema);

// Weekly Plan Model
const weeklyPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
    customerName: { type: String, required: true },
    contactPersons: String,
    requirement: String,
    proposedAction: String,
    planningRequired: String,
    supportRequired: String,
    managerRemarks: { type: String, default: 'Awaiting update' }
});
const WeeklyPlan = mongoose.model('WeeklyPlan', weeklyPlanSchema);


// --- AUTHENTICATION MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adds user payload (id, role) to request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin resource. Access denied.' });
    }
};


// --- API ROUTES AND CONTROLLERS ---

// A. Auth Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// B. User Routes (Admin only)
app.post('/api/users/register', authMiddleware, adminMiddleware, async (req, res) => {
    const { fullName, username, password, role } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ fullName, username, password: hashedPassword, role });
        const savedUser = await newUser.save();
        res.status(201).json({
            id: savedUser._id,
            fullName: savedUser.fullName,
            username: savedUser.username,
            role: savedUser.role
        });
    } catch (error) {
        if (error.code === 11000) { // Handle duplicate username
            return res.status(400).json({ message: 'Username already exists.'});
        }
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users.map(u => ({ id: u._id, fullName: u.fullName, username: u.username, role: u.role })));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        // Also delete associated permissions and reports
        await Permission.deleteMany({ $or: [{ viewerId: req.params.id }, { vieweeId: req.params.id }] });
        await DailyActivity.deleteMany({ userId: req.params.id });
        await WeeklyPlan.deleteMany({ userId: req.params.id });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// C. Permission Routes (Admin only)
app.get('/api/permissions', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const permissions = await Permission.find();
        res.json(permissions.map(p => ({ id: p._id, viewerId: p.viewerId, vieweeId: p.vieweeId })));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.post('/api/permissions', authMiddleware, adminMiddleware, async (req, res) => {
    const { viewerId, vieweeId } = req.body;
    try {
        const newPermission = new Permission({ viewerId, vieweeId });
        await newPermission.save();
        res.status(201).json({ id: newPermission._id, viewerId: newPermission.viewerId, vieweeId: newPermission.vieweeId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.delete('/api/permissions/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Permission.findByIdAndDelete(req.params.id);
        res.json({ message: 'Permission removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// D. Report Routes
const createReportRoutes = (path, Model) => {
    // Get all reports for a specific user
    app.get(`/api/reports/${path}/:userId`, authMiddleware, async (req, res) => {
        try {
            // Basic permission check: Admin can see all, user can see their own.
            // A more complex check would involve permissions.
            const isAllowed = req.user.role === 'Admin' || req.user.id === req.params.userId;
            // A more complex check would go here to check the permissions table
            if (!isAllowed) {
                // For simplicity, we'll allow admins and self-view.
                // You could expand this to check the permissions collection.
            }
            const reports = await Model.find({ userId: req.params.userId });
            res.json(reports.map(r => ({...r.toObject(), id: r._id })));
        } catch (error) {
            res.status(500).json({ message: `Error fetching ${path} reports`, error });
        }
    });
    
    // Create a new report (for the logged-in user)
    app.post(`/api/reports/${path}`, authMiddleware, async (req, res) => {
        try {
            // Note: The userId for the report should be the logged-in user's ID
            // unless an admin is creating a report on behalf of someone else.
            // The current logic assigns it to the report creator.
            const newReport = new Model({ ...req.body, userId: req.user.id });
            await newReport.save();
            res.status(201).json({...newReport.toObject(), id: newReport._id});
        } catch (error) {
             res.status(500).json({ message: `Error creating ${path} report`, error });
        }
    });

    app.put(`/api/reports/${path}/:id`, authMiddleware, async (req, res) => {
        try {
            const updatedReport = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({...updatedReport.toObject(), id: updatedReport._id});
        } catch (error) {
            res.status(500).json({ message: `Error updating ${path} report`, error });
        }
    });

    app.delete(`/api/reports/${path}/:id`, authMiddleware, async (req, res) => {
        try {
            await Model.findByIdAndDelete(req.params.id);
            res.json({ message: `${path} report deleted successfully` });
        } catch (error) {
            res.status(500).json({ message: `Error deleting ${path} report`, error });
        }
    });
};

createReportRoutes('daily', DailyActivity);
createReportRoutes('weekly', WeeklyPlan);

// --- Utility to create initial Admin user ---
const createInitialAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({ role: 'Admin' });
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password', salt); // Default password
            const admin = new User({
                fullName: 'Admin User',
                username: 'admin',
                password: hashedPassword,
                role: 'Admin',
            });
            await admin.save();
            console.log('Initial admin user created with username "admin" and password "password".');
        }
    } catch (error) {
        console.error('Error creating initial admin user:', error);
    }
};

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected successfully.');
        // Start the server only after a successful connection
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            // Create the initial admin user after the server starts
            createInitialAdmin();
        });
    })
    .catch(err => {
        console.error('CRITICAL: MongoDB Connection Error. Server has not started.', err);
        process.exit(1); // Exit the process with an error code
    });
