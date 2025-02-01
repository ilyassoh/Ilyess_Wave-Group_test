CREATE DATABASE clickfit;

USE clickfit;

CREATE TABLE users (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
    password VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
    type VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
    active TINYINT DEFAULT 1
);

DELIMITER $$

CREATE PROCEDURE addUser(IN userEmail VARCHAR(255), IN userPassword VARCHAR(255), IN userType VARCHAR(255))
BEGIN
    INSERT INTO users (email, password, type) VALUES (userEmail, userPassword, userType);
END $$

DELIMITER ;

-- Call the procedure to add a user
CALL addUser('user@example.com', 'hashedpassword123', 'admin');
