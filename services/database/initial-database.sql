SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS = @@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION = @@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `dsio_game_servers`
(
    `id`               int(11)      NOT NULL,
    `name`             varchar(63)  NOT NULL,
    `url`              varchar(255) NOT NULL,
    `first_seen`       timestamp    NOT NULL DEFAULT current_timestamp(),
    `last_seen`        timestamp    NOT NULL DEFAULT current_timestamp(),
    `player_count`     int(11)      NOT NULL DEFAULT 0,
    `should_be_online` tinyint(1)   NOT NULL DEFAULT 0,
    `is_approved`      tinyint(1)   NOT NULL DEFAULT 1,
    `token`            uuid         NOT NULL DEFAULT uuid()
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

CREATE TABLE `dsio_highscores`
(
    `id`            int(11)          NOT NULL,
    `name`          varchar(255)     NOT NULL,
    `kills`         int(10) UNSIGNED NOT NULL,
    `seconds_alive` int(10) UNSIGNED NOT NULL,
    `timestamp`     timestamp        NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci;
DROP TABLE IF EXISTS `dsio_game_servers_status`;

CREATE ALGORITHM = UNDEFINED DEFINER =`dsio`@`%` SQL SECURITY DEFINER VIEW `dsio_game_servers_status` AS
SELECT `dsio_game_servers`.`id`           AS `id`,
       `dsio_game_servers`.`name`         AS `name`,
       `dsio_game_servers`.`url`          AS `url`,
       `dsio_game_servers`.`last_seen`    AS `last_seen`,
       `dsio_game_servers`.`player_count` AS `player_count`,
       CASE
           WHEN `dsio_game_servers`.`should_be_online` = 0 THEN 'OFFLINE'
           WHEN `dsio_game_servers`.`should_be_online` <> 0 AND
                `dsio_game_servers`.`last_seen` > current_timestamp() - interval 2 minute THEN 'HEALTHY'
           ELSE 'UNHEALTHY' END           AS `status`
FROM `dsio_game_servers`
WHERE `dsio_game_servers`.`is_approved` = 1
ORDER BY `dsio_game_servers`.`should_be_online` DESC, `dsio_game_servers`.`last_seen` DESC,
         `dsio_game_servers`.`player_count` DESC;


ALTER TABLE `dsio_game_servers`
    ADD PRIMARY KEY (`id`),
# TODO: Read this line, to just allow one url from one server (better)
#    ADD UNIQUE KEY `url` (`url`),
    ADD UNIQUE KEY `token` (`token`);

ALTER TABLE `dsio_highscores`
    ADD PRIMARY KEY (`id`),
    ADD KEY `name` (`name`),
    ADD KEY `kills` (`kills`),
    ADD KEY `seconds_alive` (`seconds_alive`),
    ADD KEY `timestamp` (`timestamp`);


ALTER TABLE `dsio_game_servers`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `dsio_highscores`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT = @OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS = @OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION = @OLD_COLLATION_CONNECTION */;