// ============================================
// SUPABASE INTEGRATION
// ============================================

const SUPABASE_URL = 'https://qgpbgexemlprornunvov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGJnZXhlbWxwcm9ybnVudm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Mjg3NjEsImV4cCI6MjA4NTUwNDc2MX0.CvHRusD8GgEbMb8boVASHiYAdiqXx2BnDDyYp0SsqYU';

// Use different name to avoid conflict with SDK's global 'supabase'
let supabaseClient = null;
let currentUser = null;

function initSupabase() {
    if (supabaseClient) return true; // Already initialized

    if (typeof window.supabase === 'undefined') {
        console.warn('Supabase SDK not loaded');
        return false;
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
}

// ==================== AUTHENTICATION ====================

// Sign Up - REQUIRES real email
window.supabaseSignup = async function (email, password) {
    if (!initSupabase()) {
        alert('❌ Supabase SDK not loaded.');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        alert('❌ Please use a real email address (e.g., you@gmail.com)');
        return;
    }

    try {

        const displayName = email.split('@')[0];
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { display_name: displayName }
            }
        });

        if (error) throw error;

        // Create profile
        if (data.user) {
            await supabaseClient.from('profiles').insert({
                id: data.user.id,
                username: displayName,
                wins: 0,
                losses: 0,
                total_damage: 0
            });
        }

        alert('✅ Account created! You can now login.');
        showScreen('main-menu');
    } catch (error) {
        alert('❌ Signup failed: ' + error.message);
    }
};

// Login - uses email directly (same as signup)
window.supabaseLogin = async function (email, password) {
    if (!initSupabase()) {
        alert('❌ Supabase SDK not loaded.');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        alert('❌ Please enter your email address');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        const displayName = email.split('@')[0];
        alert('✅ Welcome back, ' + displayName + '!');
        showScreen('main-menu');
    } catch (error) {
        alert('❌ Login failed: ' + error.message);
        // Stay on login screen
    }
};

// Logout
window.supabaseLogout = async function () {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    currentUser = null;
};

// ==================== LEADERBOARD ====================

// Fetch leaderboard
window.fetchLeaderboard = async function () {
    if (!initSupabase()) return [];

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username, wins, total_damage')
            .order('wins', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Leaderboard fetch failed:', error);
        return [];
    }
};

// Update leaderboard display
window.updateLeaderboardUI = async function () {
    const data = await fetchLeaderboard();
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody || data.length === 0) return;

    const medals = ['🥇', '🥈', '🥉'];
    const rankClasses = ['rank-gold', 'rank-silver', 'rank-bronze'];

    tbody.innerHTML = data.map((player, i) => `
        <tr class="${rankClasses[i] || ''}">
            <td>${medals[i] || '#' + (i + 1)}</td>
            <td>${player.username}</td>
            <td>${player.wins}</td>
            <td>${Math.floor(player.total_damage / 1000)}k</td>
        </tr>
    `).join('');
};

// ==================== GAME STATS ====================

// Record game result
window.recordGameResult = async function (won, damageDealt) {
    if (!supabaseClient || !currentUser) return;

    try {
        // Get current stats
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('wins, losses, total_damage')
            .eq('id', currentUser.id)
            .single();

        if (profile) {
            await supabaseClient.from('profiles').update({
                wins: profile.wins + (won ? 1 : 0),
                losses: profile.losses + (won ? 0 : 1),
                total_damage: profile.total_damage + damageDealt
            }).eq('id', currentUser.id);
        }
    } catch (error) {
        console.error('Failed to record game result:', error);
    }
};

// ==================== SETUP INSTRUCTIONS ====================
/*
╔══════════════════════════════════════════════════════════════╗
║                    SUPABASE SETUP GUIDE                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. GO TO: https://supabase.com                               ║
║     - Sign up / Login                                         ║
║     - Click "New Project"                                     ║
║     - Name it "FlavorTown Battle"                             ║
║     - Set a database password (save it!)                      ║
║     - Wait for project to be created (~2 min)                 ║
║                                                               ║
║  2. GET YOUR KEYS:                                            ║
║     - Go to Settings → API                                    ║
║     - Copy "Project URL" → paste above as SUPABASE_URL        ║
║     - Copy "anon/public" key → paste as SUPABASE_ANON_KEY     ║
║                                                               ║
║  3. CREATE DATABASE TABLES:                                   ║
║     - Go to SQL Editor (left sidebar)                         ║
║     - Click "New Query"                                       ║
║     - Paste and run this SQL:                                 ║
║                                                               ║
║  ┌────────────────────────────────────────────────────────┐   ║
║  │ CREATE TABLE profiles (                                │   ║
║  │   id UUID REFERENCES auth.users PRIMARY KEY,           │   ║
║  │   username TEXT UNIQUE NOT NULL,                       │   ║
║  │   wins INT DEFAULT 0,                                  │   ║
║  │   losses INT DEFAULT 0,                                │   ║
║  │   total_damage INT DEFAULT 0,                          │   ║
║  │   created_at TIMESTAMP DEFAULT NOW()                   │   ║
║  │ );                                                     │   ║
║  │                                                        │   ║
║  │ ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;        │   ║
║  │                                                        │   ║
║  │ CREATE POLICY "Public profiles viewable"               │   ║
║  │   ON profiles FOR SELECT USING (true);                 │   ║
║  │                                                        │   ║
║  │ CREATE POLICY "Users can update own profile"           │   ║
║  │   ON profiles FOR UPDATE USING (auth.uid() = id);      │   ║
║  │                                                        │   ║
║  │ CREATE POLICY "Users can insert own profile"           │   ║
║  │   ON profiles FOR INSERT                               │   ║
║  │   WITH CHECK (auth.uid() = id);                        │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                               ║
║  4. ENABLE EMAIL AUTH:                                        ║
║     - Go to Authentication → Providers                        ║
║     - Make sure "Email" is enabled                            ║
║     - Disable "Confirm email" for easier testing              ║
║                                                               ║
║  5. TEST IT:                                                  ║
║     - Refresh the game                                        ║
║     - Try signing up with a username/password                 ║
║     - Win a game and check the leaderboard!                   ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
*/
