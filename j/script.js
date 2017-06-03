$(()=>{
	$('#upload').click(()=>{
		var $dialog=$('<div>'
			+'<iframe style="display:none" name="dialog-target"/>'
			+'<form method="post" action="/stats-upload.php" enctype="multipart/form-data" target="dialog-target">'
			+'<table class="wide">'
			+'<tr><th>Date</th><td><input name="date" id="dialog-date"/></td></tr>'
			+'<tr><th>URL</th><td><a target="_blank" href="#">download CSV</a></td></tr>'
			+'<tr><th>File</th><td><input name="file" type="file"/></td></tr>'
			+'</table>'
			+'</form>'
			+'</div>')
			.dialog({
				'modal':true,
				'width':'450px',
				'close':()=>{
					$dialog.remove();
				},
				'buttons':{
					'Save':()=>{
						$dialog
							.find('iframe')
							.on('load', ()=>{
								$dialog.remove();
								$site.change();
							});
						$dialog.find('form')
							.append($('<input name="list_id" type="hidden"/>').val($('#stats-to-show').val()))
							.submit();
					}
				}
			});
		var d = new Date();
		d.setDate(d.getDate() - 2);
		$('#dialog-date')
			.datepicker({
				'dateFormat':'yy-mm-dd'
			})
			.datepicker('setDate', d)
			.change(function() {
				var val=$(this).val().replace(/-/g, ''), $siteopt=$site.find('option:selected'), authuser=$siteopt.data('authuser'), siteurl=$siteopt.text();
				var url='https://www.google.com/webmasters/tools/search-analytics?hl=en&authuser='+authuser+'&siteUrl='+siteurl+'#state=%5Bnull%2C%5B%5Bnull%2C%22'+val+'%22%2C%22'+val+'%22%5D%5D%2Cnull%2C%5B%5Bnull%2C6%2C%5B%22WEB%22%5D%5D%5D%2Cnull%2C%5B2%2C4%5D%2C1%2C0%2Cnull%2C%5B2%5D%5D';
				$dialog.find('a').attr('href', url);
			})
			.change()
			.blur();
	});
	var $site=$('#stats-to-show'), site_val=$site.val();
	var tooltips=0, charts=0;
	var keywordData=[];
	$site.change(()=>{
		var site_id=+$site.val(), $wrapper=$('#data-view').empty();
		if (!site_id) {
			return;
		}
		var table='<table id="data-table"><thead><tr><th>Keyword</th><th>Last Impression</th><th>Clicks<th>Impressions</th><th>Position</th><th>Importance</th><th>Hide<input type="checkbox" id="show-hidden"/></th></tr></thead><tbody></tbody></table>';
		var $table=$(table).appendTo($wrapper);
		$.post('/stats-get.php', {
			'site_id':site_id
		}, (data)=>{
			var trs=[];
			for (var i=0;i<data.length;++i) {
				var $tr=$('<tr/>');
				$tr.data('id', data[i].id);
				if (+data[i].hide) {
					$tr.addClass('hide');
				}
				$('<td/>').text(data[i].name).appendTo($tr);
				$('<td/>').text(data[i].last_seen).appendTo($tr);
				$('<td/>').text(data[i].clicks28).appendTo($tr);
				$('<td/>').text(data[i].impressions28).appendTo($tr);
				$('<td/>').text((+data[i].position28).toFixed(2)).appendTo($tr);
				$('<td/>').text((+data[i].importance).toFixed(2)).appendTo($tr);
				$('<td/>').append($('<input class="hide" type="checkbox"/>').prop('checked', +data[i].hide)).appendTo($tr);
				trs.push($tr);
			}
			$table.find('tbody').append(trs);
			$table.find('input.hide').change(function() {
				var $tr=$(this).closest('tr').removeClass('hide');
				var id=$tr.data('id'), hide=$(this).is(':checked');
				$.post('/keyword-hide.php', {
					'id':id,
					'hide':+hide
				}, ()=>{
					if (hide) {
						$tr.addClass('hide');
					}
				});
				calculateHighlights();
			});
			$table.find('#show-hidden').click(function() {
				var val=+$(this).is(':checked');
				$table.removeClass('show-hidden');
				if (val) {
					$table.addClass('show-hidden');
				}
				calculateHighlights();
			});
			calculateHighlights();
			$table.find('tbody tr').tooltip({
				'items':'*',
				'show':0,
				'track':true,
				'content':function() {
					var $tr=$(this).closest('tr');
					var tooltip=$tr.data('title'), keyword_id=$tr.data('id');
					var html='<div id="tooltip'+tooltips+'">'+(tooltip?'<em>'+tooltip.replace("\n", '<br/>')+'</em>':'')+'</div>';
					var thisTooltip='#tooltip'+tooltips;
					tooltips++;
					function showGraph(data) {
						var config={
							'axisY':{
								'minimum':0
							},
							'axisX':{
								'valueFormatString':'MMM-DD'
							},
							'data':[
								{
									'type':'line',
									'dataPoints':[]
								}
							]
						};
						for (var i=0;i<data.length;++i) {
							config.data[0].dataPoints.push({
								'x':new Date(data[i].cdate),
								'y':+data[i].importance
							});
						}
						$('<div id="chart'+charts+'" style="width:300px;height:150px"/>').appendTo(thisTooltip);
						$('#chart'+charts).CanvasJSChart(config);
						charts++;
						$(thisTooltip).closest('.ui-tooltip').addClass('no-opacity');
					}
					if (keywordData[keyword_id]) {
						setTimeout(function() {
							showGraph(keywordData[keyword_id]);
						}, 1);
					}
					else {
						setTimeout(function() {
							if ($(thisTooltip).is(':visible')) {
								$.post('/keyword-getData.php', {
									'id':keyword_id
								}, (data)=>{
									keywordData[keyword_id]=data;
									showGraph(data);
								});
							}
						}, 1000);
					}
					return html;
				}
			});
		});
		function calculateHighlights() {
			var $trs=$table.find('tr').not('.hide');
			$trs.removeClass('highlight').data('title', '');
			for (var i=2;i<$trs.length;++i) {
				var comments=[], highlight=0;
				var $tr=$($trs[i]), $prevTr=$($trs[i-1]);
				if (+$tr.find('td:nth-child(3)').text() > +$prevTr.find('td:nth-child(3)').text()) {
					comments.push('improve clicks by checking how this is visible in Google and adjusting the text');
					highlight++;
				}
				if (+$tr.find('td:nth-child(4)').text() > +$prevTr.find('td:nth-child(4)').text()) {
					comments.push('write a blog post that includes this keyword');
					highlight++;
				}
				if (highlight) {
					$tr.addClass('highlight').data('title', comments.join("\n"));
				}
			}
		}
	});
	$.post('/sites-list.php', (sites)=>{
		var opts=[];
		for (var i=0;i<sites.length;++i) {
			opts.push($('<option value="'+sites[i].id+'"/>').text(sites[i].name).data('authuser', sites[i].authuser));
		}
		$site.append(opts);
	});
});
