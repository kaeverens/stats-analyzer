# stats-analyzer
analyzes statistics from Google's Webmaster Search Analytics tool to provide hints as to what needs work

it does not include any user authentication, so either run it on your laptop, or add your own authentication

to use this, you need a PHP/MySQL server.

1. create a database called "stats" in the MySQL server and import dist/stats.sql
2. edit dist/config.php then move it up to the main directory
3. log into the database and insert rows into the "sites" table. The information is based on your Google Webmasters Search Analytics URL.
    1. "authuser" is the authuser number in your Google Webmasters URL
		2. "name" is your site URL as written in the Google Webmasters URL. for example, "http://liveforeverbook.info/"

once installed with at least one site, it should look like this in your browser:
!(images/screen1.jpg)


