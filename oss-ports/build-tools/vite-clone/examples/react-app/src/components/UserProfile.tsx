/**
 * UserProfile Component - Demonstrates async data and forms
 */

import React, { useState, useEffect } from 'react';
import './UserProfile.css';

interface User {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  skills: string[];
}

export default function UserProfile() {
  const [user, setUser] = useState<User>({
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://via.placeholder.com/150',
    bio: 'Full-stack developer passionate about building great user experiences.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    skills: ['React', 'TypeScript', 'Node.js', 'Elide'],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(user);
  const [newSkill, setNewSkill] = useState('');

  const handleSave = () => {
    setUser(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter((s) => s !== skill),
    });
  };

  if (isEditing) {
    return (
      <div className="user-profile editing">
        <h2>Edit Profile</h2>

        <div className="profile-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Avatar URL</label>
            <input
              type="url"
              value={editForm.avatar}
              onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="url"
              value={editForm.website}
              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Skills</label>
            <div className="skills-editor">
              <div className="skills-list">
                {editForm.skills.map((skill) => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    <button onClick={() => removeSkill(skill)}>×</button>
                  </span>
                ))}
              </div>
              <div className="skill-input">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill"
                />
                <button onClick={addSkill} className="btn btn-sm">
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleSave} className="btn btn-primary">
              Save Changes
            </button>
            <button onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>

        <div className="profile-info">
          <p>Try editing and saving - your changes will be reflected instantly!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <h2>User Profile</h2>

      <div className="profile-header">
        <img src={user.avatar} alt={user.name} className="profile-avatar" />
        <div className="profile-info-header">
          <h3>{user.name}</h3>
          <p className="profile-email">{user.email}</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="profile-section">
          <h4>Bio</h4>
          <p>{user.bio}</p>
        </div>

        <div className="profile-section">
          <h4>Location</h4>
          <p>📍 {user.location}</p>
        </div>

        <div className="profile-section">
          <h4>Website</h4>
          <p>
            <a href={user.website} target="_blank" rel="noopener noreferrer">
              {user.website}
            </a>
          </p>
        </div>

        <div className="profile-section">
          <h4>Skills</h4>
          <div className="skills-display">
            {user.skills.map((skill) => (
              <span key={skill} className="skill-badge">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button onClick={() => setIsEditing(true)} className="btn btn-primary">
          Edit Profile
        </button>
      </div>

      <div className="profile-info">
        <p>Click Edit to modify profile - state is preserved with HMR!</p>
      </div>
    </div>
  );
}
