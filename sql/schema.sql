CREATE TABLE hackathons (
    Hackathon_Id INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(200) NOT NULL,
    Description VARCHAR(MAX) NULL,
    Start_Date DATE NOT NULL,
    End_Date DATE NOT NULL,
    CONSTRAINT CHK_hackathon_dates CHECK (End_Date >= Start_Date)
);

CREATE TABLE user_hackathons (
    User_Id INT NOT NULL,
    Hackathon_Id INT NOT NULL,
    Status VARCHAR(10) NOT NULL DEFAULT 'joined',
    Join_Date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    Leave_Date DATE NULL,
    CONSTRAINT PK_user_hackathons PRIMARY KEY (User_Id, Hackathon_Id),
    CONSTRAINT CHK_user_hackathons_status CHECK (Status IN ('joined','left')),
    CONSTRAINT FK_user_hackathons_hackathon FOREIGN KEY (Hackathon_Id)
        REFERENCES hackathons(Hackathon_Id) ON DELETE CASCADE
);

CREATE TABLE teams (
    Team_Id INT IDENTITY(1,1) PRIMARY KEY,
    Hackathon_Id INT NOT NULL,
    Team_Name VARCHAR(100) NOT NULL,
    CONSTRAINT FK_teams_hackathon FOREIGN KEY (Hackathon_Id)
        REFERENCES hackathons(Hackathon_Id) ON DELETE CASCADE
);

CREATE TABLE team_members (
    Team_Id INT NOT NULL,
    User_Id INT NOT NULL,
    Joined_Date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT PK_team_members PRIMARY KEY (Team_Id, User_Id),
    CONSTRAINT FK_team_members_team FOREIGN KEY (Team_Id)
        REFERENCES teams(Team_Id) ON DELETE CASCADE
);