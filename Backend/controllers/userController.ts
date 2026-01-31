import { Request, Response } from "express";
import { TryCatch } from "../utils/tryCatch";
import prisma from "../config/client";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail";

const addEmployee = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { name, email, role, orgId } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // RBAC rules for adding users
    if (req.user.role === "OWNER") {
        // OWNER can add any role except OWNER
        if (role === "OWNER") {
            return res.status(400).json({ message: "Cannot create another OWNER" });
        }
        // OWNER can specify orgId to add to any organization
    } else if (req.user.role === "ADMIN") {
        // ADMIN can only add MANAGER and SALES
        if (!["MANAGER", "SALES"].includes(role)) {
            return res.status(400).json({ message: "Admins can only add MANAGER or SALES users" });
        }
    } else if (req.user.role === "MANAGER") {
        if (role !== "SALES") {
            return res.status(403).json({ message: "Managers can only add SALES users" });
        }
    } else {
        return res.status(403).json({ message: "You are not allowed to add users" });
    }

    // Fetch creator to get orgId
    const creator = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { orgId: true }
    });

    if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
    }

    // Determine target organization
    // OWNER can specify orgId, others use their own org
    const targetOrgId = req.user.role === "OWNER" && orgId ? orgId : creator.orgId;

    // Check if email already exists
    const existing = await prisma.user.findUnique({
        where: { email }
    });

    if (existing) {
        return res.status(409).json({ message: "User already exists" });
    }

    // Generate temp password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create new user
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            orgId: targetOrgId
        }
    });

    // Send email
    await sendEmail(
        email,
        "You have been added to FlowCRM",
        `
        <h3>Hello ${name},</h3>
        <p>You have been added as <b>${role}</b> to your organization's CRM.</p>
        <p>Your temporary password is: <b>${tempPassword}</b></p>
        <p>Please login and change your password.</p>
        `
    );

    res.status(201).json({
        message: "Employee added successfully",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }
    });
});

const updateEmployee = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const userId = req.params.id as string;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const { name, role } = req.body;
    if (!name && !role) {
        return res.status(400).json({ message: "At least one field (name or role) is required to update" });
    }
    const userToUpdate = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
    }
    
    // OWNER can update any user (except other OWNERs)
    if (req.user.role === "OWNER") {
        if (userToUpdate.role === "OWNER" && userToUpdate.id !== req.user.userId) {
            return res.status(403).json({ message: "Cannot update other OWNER users" });
        }
    } else {
        // Non-OWNER users can only update within their organization
        if (userToUpdate.orgId !== req.user.orgId) {
            return res.status(403).json({ message: "You can only update users within your organization" });
        }
        // ADMIN cannot update other ADMINs or OWNERs
        if (req.user.role === "ADMIN" && (userToUpdate.role === "ADMIN" || userToUpdate.role === "OWNER")) {
            if (userToUpdate.id !== req.user.userId) {
                return res.status(403).json({ message: "Cannot update ADMIN or OWNER users" });
            }
        }
    }
    
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            name: name || userToUpdate.name,
            role: role || userToUpdate.role
        }
    });
    res.status(200).json({
        message: "User updated successfully",
        user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
        }
    });

});

const deleteEmployee = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const userId = req.params.id as string;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const userToDelete = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
    }
    
    // Cannot delete OWNER
    if (userToDelete.role === "OWNER") {
        return res.status(403).json({ message: "Cannot delete OWNER users" });
    }
    
    // OWNER can delete any non-OWNER user
    if (req.user.role === "OWNER") {
        // OK - can delete
    } else {
        // Non-OWNER users can only delete within their organization
        if (userToDelete.orgId !== req.user.orgId) {
            return res.status(403).json({ message: "You can only delete users within your organization" });
        }
        // ADMIN cannot delete other ADMINs
        if (req.user.role === "ADMIN" && userToDelete.role === "ADMIN") {
            return res.status(403).json({ message: "Cannot delete ADMIN users" });
        }
    }

    const deletedUser = await prisma.user.delete({
        where: { id: userId }
    });
    res.status(200).json({
        message: "User deleted successfully",
        user: {
            id: deletedUser.id,
            name: deletedUser.name,
            email: deletedUser.email,
            role: deletedUser.role
        }
    });
});

const getEmployees = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    
    // OWNER can see all users across all organizations
    const whereClause = req.user.role === "OWNER" 
        ? {} 
        : { orgId: req.user.orgId };
    
    const employees = await prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            org: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    
    // Map org to organization for frontend consistency
    const mappedEmployees = employees.map(emp => ({
        ...emp,
        organization: emp.org,
        org: undefined
    }));
    
    res.status(200).json({ employees: mappedEmployees });
});

const getEmployeeById = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const userId = req.params.id as string;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const employee = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });
    if (!employee) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ employee });
});

export { addEmployee, updateEmployee, deleteEmployee, getEmployees, getEmployeeById };