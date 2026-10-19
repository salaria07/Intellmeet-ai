import mongoose from 'mongoose';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';
import { memoryStore, generateId } from '../utils/memoryStore.js';

/**
 * @route   GET /api/teams
 * @desc    Get primary team for current user or default team
 * @access  Private
 */
export const getTeam = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      let team = await Team.findOne().populate('members.user', 'name email avatar role jobTitle department status');
      
      // If no team exists in MongoDB, create default workspace team
      if (!team) {
        const users = await User.find().limit(10);
        team = await Team.create({
          name: 'Core Platform & AI Systems',
          description: 'Intelligent collaboration workspace for modern distributed teams.',
          owner: req.user._id,
          department: 'Engineering & AI',
          members: users.map((u) => ({
            user: u._id,
            role: u.role || 'Member',
            joinedAt: u.createdAt || new Date(),
          })),
        });
        await team.populate('members.user', 'name email avatar role jobTitle department status');
      }

      let memberList = (team.members || []).map((m) => ({
        _id: m.user?._id || generateId(),
        name: m.user?.name || 'Team Member',
        email: m.user?.email || '',
        avatar: m.user?.avatar || '',
        teamRole: m.role || 'Member',
        systemRole: m.user?.role || 'Member',
        jobTitle: m.user?.jobTitle || 'Engineer',
        department: m.user?.department || team.department,
        status: m.user?.status || 'Online',
        joinedAt: m.joinedAt,
      }));

      // Apply search/filters
      if (search) {
        const q = search.toLowerCase();
        memberList = memberList.filter(
          (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.jobTitle.toLowerCase().includes(q)
        );
      }
      if (role && role !== 'all') {
        memberList = memberList.filter((m) => m.teamRole.toLowerCase() === role.toLowerCase());
      }
      if (status && status !== 'all') {
        memberList = memberList.filter((m) => m.status.toLowerCase() === status.toLowerCase());
      }

      return res.status(200).json({
        success: true,
        team: {
          _id: team._id,
          name: team.name,
          description: team.description,
          department: team.department,
          memberCount: memberList.length,
          members: memberList,
        },
      });
    } else {
      const team = memoryStore.teams[0] || {
        _id: '65b000000000000000000001',
        name: 'Core Platform & AI Systems',
        description: 'Intelligent collaboration workspace for modern distributed teams.',
        department: 'Engineering & AI',
        members: [],
      };

      let memberList = memoryStore.users.map((u) => {
        const membership = (team.members || []).find((m) => m.user.toString() === u._id.toString());
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          teamRole: membership?.role || u.role || 'Member',
          systemRole: u.role || 'Member',
          jobTitle: u.jobTitle || 'Team Member',
          department: u.department || 'Product & AI',
          status: u.status || 'Online',
          joinedAt: membership?.joinedAt || u.createdAt || new Date(),
        };
      });

      if (search) {
        const q = search.toLowerCase();
        memberList = memberList.filter(
          (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.jobTitle.toLowerCase().includes(q)
        );
      }
      if (role && role !== 'all') {
        memberList = memberList.filter((m) => m.teamRole.toLowerCase() === role.toLowerCase());
      }
      if (status && status !== 'all') {
        memberList = memberList.filter((m) => m.status.toLowerCase() === status.toLowerCase());
      }

      return res.status(200).json({
        success: true,
        team: {
          _id: team._id,
          name: team.name,
          description: team.description,
          department: team.department,
          memberCount: memberList.length,
          members: memberList,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teams/invite
 * @desc    Invite new team member by email & role
 * @access  Private (Admin or Manager)
 */
export const inviteMember = async (req, res, next) => {
  try {
    const { email, name, role = 'Member', jobTitle, department } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide member email address.' });
    }

    // Role check: only Admin and Manager can invite
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      return res.status(403).json({
        success: false,
        message: 'Only Administrators and Managers can invite new workspace members.',
      });
    }

    const memberName = name || email.split('@')[0];
    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      let existingUser = await User.findOne({ email: normalizedEmail });
      if (!existingUser) {
        existingUser = await User.create({
          name: memberName,
          email: normalizedEmail,
          password: 'Password123!', // temporary password
          role,
          jobTitle: jobTitle || 'Team Member',
          department: department || 'Engineering',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}`,
        });
      }

      let team = await Team.findOne();
      if (team) {
        const isMember = team.members.some((m) => m.user.toString() === existingUser._id.toString());
        if (!isMember) {
          team.members.push({ user: existingUser._id, role, joinedAt: new Date() });
          await team.save();
        }
      }

      return res.status(201).json({
        success: true,
        message: `Invitation successfully issued to ${normalizedEmail}.`,
        member: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          teamRole: role,
          status: 'Online',
        },
      });
    } else {
      let existingUser = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!existingUser) {
        existingUser = {
          _id: generateId(),
          name: memberName,
          email: normalizedEmail,
          role,
          jobTitle: jobTitle || 'Team Member',
          department: department || 'Engineering',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberName)}`,
          status: 'Online',
          createdAt: new Date(),
        };
        memoryStore.users.push(existingUser);
      }

      const team = memoryStore.teams[0];
      if (team) {
        const isMember = (team.members || []).some((m) => m.user.toString() === existingUser._id.toString());
        if (!isMember) {
          team.members = team.members || [];
          team.members.push({ user: existingUser._id, role, joinedAt: new Date() });
        }
      }

      return res.status(201).json({
        success: true,
        message: `Invitation successfully issued to ${normalizedEmail}.`,
        member: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          teamRole: role,
          status: 'Online',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/teams/members/:id/role
 * @desc    Update team member role
 * @access  Private (Admin only)
 */
export const updateMemberRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Manager', 'Member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be Admin, Manager, or Member.' });
    }

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only Administrators can modify member roles.' });
    }

    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndUpdate(id, { role });
      await Team.updateOne({ 'members.user': id }, { $set: { 'members.$.role': role } });
    } else {
      const user = memoryStore.users.find((u) => u._id.toString() === id);
      if (user) user.role = role;

      const team = memoryStore.teams[0];
      if (team) {
        const mem = (team.members || []).find((m) => m.user.toString() === id);
        if (mem) mem.role = role;
      }
    }

    res.status(200).json({
      success: true,
      message: `Member role updated to ${role}.`,
    });
  } catch (error) {
    next(error);
  }
};
