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
							.append($('<input name="site_id" type="hidden"/>').val($('#stats-to-show').val()))
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
	window.keywordData=[];
	$site.change(()=>{
		var site_id=+$site.val(), $wrapper=$('#data-view').empty();
		if (!site_id) {
			return;
		}
		var table='<table id="data-table" style="width:100%"><thead>'
			+'<tr class="overall"><th>Keyword</th><th>Group</th><th>Last Impression</th><th class="clicks">Clicks<th class="impressions">Impressions</th><th class="position">Position</th><th class="importance">Importance</th><th>Hide<input type="checkbox" id="show-hidden"/></th></tr>'
			+'</thead><tbody></tbody></table>';
		var $table=$(table).appendTo($wrapper);
		$.post('/stats-get.php', {
			'site_id':site_id
		}, (ret)=>{
			var trs=[], data=ret.keywords, groups=ret.groups;
			groups.push({
				'id':0,
				'name':' -- '
			});
			var groupNames=[];
			for (var i=0;i<groups.length;++i) {
				groupNames[+groups[i].id]=groups[i].name;
			}
			for (var j=0;j<groups.length;++j) {
				var group=groups[j];
				var $tr=$('<tr class="category-header"/>');
				$tr.data('id', group.id);
				$('<td class="keyword"/>').text(group.name).appendTo($tr);
				$('<td class="group"/>').text('').appendTo($tr);
				$('<td class="last_impression"/>').text(group.last_impression).appendTo($tr);
				$('<td class="clicks"/>').text(group.clicks).appendTo($tr);
				$('<td class="impressions"/>').text(group.impressions).appendTo($tr);
				$('<td class="position"/>').text(group.position).appendTo($tr);
				$('<td class="importance"/>').text(group.importance).appendTo($tr);
				$('<td class="showhide"/>').append(
					$('<button>hide</button>')
						.click(function() {
							var $this=$(this), type=$this.text(), $tr=$this.closest('tr');
							var $next=$tr.next('tr');
							while ($next.length && !$next.hasClass('category-header')) {
								$next.removeClass('category-hide category-show').addClass('category-'+type)
								$next=$next.next('tr');
							}
							type=type=='hide'?'show':'hide';
							$this.text(type);
							return false;
						})
				).appendTo($tr);
				trs.push($tr);
				for (var i=0;i<data.length;++i) {
					if (data[i].group_id!=group.id) {
						continue;
					}
					var $tr=$('<tr/>');
					$tr.data('id', data[i].id);
					if (+data[i].hide) {
						$tr.addClass('hide');
					}
					$('<td class="keyword"/>').text(data[i].name).appendTo($tr);
					$('<td class="group"/>').data('group', data[i].group_id).text(groupNames[+data[i].group_id]||' -- ').appendTo($tr);
					$('<td class="last_impression"/>').text(data[i].last_seen.replace(/^....-/, '')).appendTo($tr);
					$('<td class="clicks"/>').text(data[i].clicks28).appendTo($tr);
					$('<td class="impressions"/>').text(data[i].impressions28).appendTo($tr);
					$('<td class="position"/>').text((+data[i].position28).toFixed(2)).appendTo($tr);
					$('<td class="importance"/>').text((+data[i].importance).toFixed(2)).appendTo($tr);
					$('<td class="hide"/>').append($('<input class="hide" type="checkbox"/>').prop('checked', +data[i].hide)).appendTo($tr);
					trs.push($tr);
				}
			}
			$table.find('tbody').append(trs);
			$table.on('change', 'input.hide', function() {
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
			$table.on('click', '#show-hidden', function() {
				var val=+$(this).is(':checked');
				$table.removeClass('show-hidden');
				if (val) {
					$table.addClass('show-hidden');
				}
				calculateHighlights();
			});
			calculateHighlights();
			$table.tooltip({
				'items':'*',
				'show':0,
				'track':true,
				'content':function() {
					var $td=$(this).closest('td,th'), class_name=$td.attr('class'), $tr=$td.closest('tr'), tooltip=$tr.data('title'), keyword_id=$tr.data('id')||0;
					if (class_name===undefined || class_name=='keyword' || class_name=='last_impression' || class_name=='hide' || class_name=='group' || class_name=='showhide') {
						return false;
					}
					var data_type=0;
					if ($tr.hasClass('overall')) {
						data_type=1;
					}
					if ($tr.hasClass('category-header')) {
						data_type=2;
					}
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
								'x':new Date(data[i][0]),
								'y':+data[i][1]
							});
						}
						$('<div id="chart'+charts+'" style="width:300px;height:150px"/>').appendTo(thisTooltip);
						$('#chart'+charts).CanvasJSChart(config);
						charts++;
						$(thisTooltip).closest('.ui-tooltip').addClass('no-opacity');
					}
					var idx=site_id+'|'+class_name+'|'+data_type+'|'+keyword_id;
					if (keywordData[idx]) {
						setTimeout(function() {
							showGraph(keywordData[idx]);
						}, 1);
					}
					else {
						setTimeout(function() {
							if ($(thisTooltip).is(':visible')) {
								$.post('/keyword-getData.php', {
									'id':keyword_id,
									'site_id':site_id,
									'data_type':data_type,
									'type':class_name
								}, (data)=>{
									keywordData[idx]=data;
									showGraph(data);
								});
							}
						}, 1000);
					}
					return html;
				}
			});
			$table.on('click', 'td.group', function() {
				var $this=$(this);
				if ($this.data('clicked')) {
					return;
				}
				$this.data('clicked', true);
				var group_id=+$this.data('group');
				$.post('/groups-list.php', {
					'site_id':site_id
				}, function(ret) {
					ret.push({
						'id':'-1',
						'name':' -- Add Group -- '
					});
					var $sel=$('<select style="width:90%"><option value="0"/></select>');
					for (var i=0;i<ret.length;++i) {
						$('<option value="'+ret[i].id+'"/>').text(ret[i].name).appendTo($sel);
					}
					$sel
						.appendTo($this.empty())
						.on('change', function() {
							var val=+$sel.val();
							if (val==-1) {
								var group_name=prompt('What is the new group name');
								if (!group_name || group_name===null) {
									return $this.empty().text(groupNames[group_id] || ' -- ').data('clicked', false);
								}
								$.post('/group-add.php', {
									'site_id':site_id,
									'name':group_name
								}, function(ret) {
									group_id=ret.id;
									groupNames[group_id]=ret.name;
									$this.data('group', group_id);
									$.post('/keyword-group-set.php', {
										'keyword_id':$this.closest('tr').data('id'),
										'group_id':group_id
									}, function() {
										return $this.empty().text(groupNames[group_id] || ' -- ').data('clicked', false);
									});
								});
							}
							else {
								group_id=val;
								$.post('/keyword-group-set.php', {
									'keyword_id':$this.closest('tr').data('id'),
									'group_id':group_id
								}, function() {
									return $this.empty().text(groupNames[group_id] || ' -- ').data('clicked', false);
								});
							}
						})
						.val(group_id);
				});
			});
			setTimeout(function() {
				$table.find('button').click();
			}, 1);
		});
		function calculateHighlights() {
			var $trs=$table.find('tr').not('.hide');
			$trs.removeClass('highlight').data('title', '');
			for (var i=1;i<$trs.length;++i) {
				var comments=[], highlight=0;
				var $tr=$($trs[i]);
				if (i<$trs.length-1 && +$tr.find('td:nth-child(3)').text() < +$($trs[i+1]).find('td:nth-child(3)').text()) {
					comments.push('improve clicks. check how this appears in a Google search and adjust the text in the linked document to make it more obvious that it is the right page');
					highlight++;
				}
				if (i>1 && +$tr.find('td:nth-child(4)').text() > +$($trs[i-1]).find('td:nth-child(4)').text()) {
					comments.push('improve position by learning something new about this keyword\'s subject and writing about it, using the keyword');
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
