# stats-analyzer
analyzes statistics from Google's Webmaster Search Analytics tool to provide hints as to what needs work

it does not include any user authentication, or request sanitation, so either run it on your laptop, or add your own authentication. do NOT run this on the open Internet.

to use this, you need a PHP/MySQL server.

1. create a database called "stats" in the MySQL server and import dist/stats.sql
2. edit dist/config.php then move it up to the main directory
3. log into the database and insert rows into the "sites" table. The information is based on your Google Webmasters Search Analytics URL.
    1. "authuser" is the authuser number in your Google Webmasters URL
		2. "name" is your site URL as written in the Google Webmasters URL. for example, "http://liveforeverbook.info/"

once installed with at least one site, it should look like this in your browser:
![](https://raw.githubusercontent.com/kaeverens/stats-analyzer/master/images/screen1.png)

to start adding data, select one of the sites you added, then click the Upload button. the dialog should look like this:
![](https://raw.githubusercontent.com/kaeverens/stats-analyzer/master/images/screen2.png)

1. set the Date to the date of the earliest data you want to import. the program calculates some data based on 28-day sums and averages, so importing from 30 days ago onwards is a good choice.
2. click the "download CSV" link. it will open your Google Webmaster Search Analytics page in another tab. scroll down the bottom, change the dropdown to 500 (as much data as possible), then download as CSV
3. go back to the stats tab. either click the Choose File button and upload from your downloads directory, or simply drag the downloaded file from the status bar
4. click Save. it will upload the file, calculate various things, reload the table of data on the page (if any) and close the dialog.
5. repeat for every day of data you want to include

you can hide keywords that you're not interested in by clicking the Hide checkbox on the right of the keyword's row. you can see a list of all hidden keywords by clicking the Hide checkbox in the table header.

Example table (from my [LiveForever](http://liveforeverbook.info) project (just started)):
![](https://raw.githubusercontent.com/kaeverens/stats-analyzer/master/images/screen3.png)

highlighted rows show keywords that can probably be improved easily. In the example image, the second row could be improved by either writing a blog based around it (improving its position), or by finding out how it looks in Google's results and changing the wording in the original document to be more appealing (encouraging more clicks).

"importance" is a figure based on a calculation I came up with to boil down how valuable a keyword is to just one number. It's based on 28-day sums and averages, and looks like this:
```
(1+clicks/impressions)*(impressions/position)
```

If you hover your mouse over a row, then a graph will appear about a second later showing how the importance graphed over time. This will help you know that your efforts are succeeding.
![](https://raw.githubusercontent.com/kaeverens/stats-analyzer/master/images/screen4.png)

