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
![](images/screen1.jpg)

to start adding data, select one of the sites you added, then click the Upload button. the dialog should look like this:
![](images/screen2.jpg)

1. set the Date to the date of the earliest data you want to import. the program calculates some data based on 28-day sums and averages, so importing from 30 days ago onwards is a good choice.
2. click the "download CSV" link. it will open your Google Webmaster Search Analytics page in another tab. scroll down the bottom, change the dropdown to 500 (as much data as possible), then download as CSV
3. go back to the stats tab. either click the Choose File button and upload from your downloads directory, or simply drag the downloaded file from the status bar
4. click Save. it will upload the file, calculate various things, reload the table of data on the page (if any) and close the dialog.
5. repeat for every day of data you want to include
