const { sql, poolPromise } = require('../db/pool');
const { isValidId } = require('../utils/validators');

async function getHackathons(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT Hackathon_Id, Name, Description, Start_Date, End_Date FROM hacakthons ORDER BY Start_Date DESC`);
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({error: 'Failed to fetch hackathons.'});
    }
}

async function createHackathon(req, res) {
    const { name, description, startDate, endDate } = req.body;
    if (!name || typeof name !== 'string' || !name.trim() || !startDate || !endDate) {
        return res.status(400).json({error: 'Name, Start Date, and End Date are required.'})
    }
    const s = new Date(startDate), e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())){
        return res.status(400).json({error: 'Start Date and End Date must be valid dates.'})
    }
    if (e < s) return res.status(400).json({error: 'End Date cannot be earlier than the Start Date.'})
    
    try {
        const pool = await poolPromise;
        const result = await poo.request()
            .input('name', sql.VarChar(200), name)
            .input('description', sql.VarChar(sql.MAX), description || null)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`INSERT INTO hackathons (Name, Description, Start_Date, End_Date) OUTPUT INSERTED.* VALUES (@name, @description, @startDate, @endDate)`);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({error: 'Failed to create hackathon.'});
    }
}

//Status-Based Join
async function joinHackathon(req, res){
    const userId = req.userId;
    const { hackathonId} = req.body;
    if (!hackathonId || !isValidId(hackathonId)) {
        return res.status(400).json({error: 'Hackathon ID must be a valid positive integer.'});
    }

    try {
        const pool = await poolPromise;

        const hackathonCheck = await pool.request()
            .input('hackathonId', sql.Int, hackathonId)
            .query(`SELECT Hackathon_Id FROM hackathons WHERE Hackathon_Id = @hackathonId`);
        if (hackathonCheck.recordset.length === 0) {
                return res.status(404).json({error: 'Hackathon not found.'});
        }
        
        const existing = await pool.request()
            .input('userId', sql.Int, userId)
            .input('hackathonId', sql.Int, hackathonId)
            .query('SELECT Status FROM user_hackathons WHERE User_Id = @userId AND Hackathon = @hackathonId');

        if (existing.recordset.length === 0) {
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('hackathonId', sql.Int, hackathonId)
                .query(`INSERT INTO user_hackathons (User_Id, Hackathon_Id, Status, Join_Date, Leave_Date) VALUES (@userId, @hackathonId, 'joined', CAST(GETDATE() AS DATE), NULL)`);
            return res.status(201).json({ message: 'Joined hackathon successfully.'});
        }

        if (existing.recordset[0].Status === 'joined') {
            return res.status(409).json({ error: 'User has already joined this hackathon.'});
        }

        await pool.request()
            .input('userId', sql.Int, userId)
            .input('hackathonId', sql.Int, hackathonId)
            .query(`UPDATE user_hackathons SET Status = 'joined', Join_Date = CAST(GETDATE() AS DATE), Leave_Date = NULL
              WHERE User_Id = @userId AND Hackathon_Id = @hackathonId`)
        res.status(201).json({message: 'Rejoined hackathon successfully.'});
        } catch (err) {
            res.status(500).json({error: 'Failed to join hackathon.'});
        }
}

async function leaveHackathon(req, res){
    const userId = req.userId;
    const { hackathonId } = req.body;
    if (!hackathonId || !isValidId(hackathonId)) {
        return res.status(400).json({error: 'Hackathon ID must be a valid positive integer.'});
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('hackathonId', sql.Int, hackathonId)
            .query(`UPDATE user_hackathons SET Status = 'left', Leave_Date = CAST(GETDATE() AS DATE) WHERE User_Id = @userId AND Hackathon_Id = @hackathonId AND Status = 'joined'`);

        if (result.rowsAffected[0] === 0 ) {
            return res.status(404).json({error: 'User is not an active participant of this hackathon'});
        }
        res.status(200).json({message: 'Left hackathon successfully.'});
    } catch (error) {
        res.status(500).json({error: 'Failed to leave hackathon.'});
    }
}

module.exports = { getHackathons, createHackathon, joinHackathon, leaveHackathon };