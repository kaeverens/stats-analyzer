$(()=>{
	var days_behind=4; // how many days behind is the current data
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
		d.setDate(d.getDate() - 3);
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
		function calculateTrends() {
			var $trs=$('tbody tr:visible');
			$trs.each(function() {
				var $tr=$(this), $trend=$tr.find('.trend14');
				if (!$trend.length || !$trend.text()=='') {
					return;
				}
				var data_type=0;
				if ($tr.hasClass('category-header')) {
					data_type=2;
				}
				var id=+$tr.data('id');
				if (id) {
					$.post('./keyword-getData.php', {
						'id':id,
						'data_type':data_type,
						'site_id':site_id,
						'days':33
					}, (ret)=>{
						var offset=Math.floor((new Date)/1000/86400)-32, vals=[];
						for (var i=0;i<(33-days_behind);++i) {
							vals[i]=[i,0];
						}
						for (var i=0;i<ret.length;++i) {
							var idx=+(new Date(ret[i][0])/(60*60*24*1000))-offset;
							vals[idx]=[idx, ret[i][1]];
						}
						function calc(days) {
							var $trend=$tr.find('.trend'+days), highest=-100, lowest=100, $trendLowest, $trendHighest;
							var vals2=[];
							for (var i=vals.length-days;i<vals.length;++i) {
								vals2.push(vals[i]);
							}
							var lr=ss.linearRegression(vals2);
							$trend.text(lr.m.toFixed(4));
						}
						calc(28);
						calc(14);
					});
				}
			});
		}
		var site_id=+$site.val(), $wrapper=$('#data-view').empty();
		if (!site_id) {
			return;
		}
		var table='<table id="data-table" style="width:100%"><thead>'
			+'<tr class="overall"><th>Keyword</th><th>Group</th><th>Last Impression</th><th class="clicks">Clicks<th class="impressions">Impressions</th><th class="position">Position</th><th class="importance">Importance</th><th class="trend14" title="14 day trend">14D Trend</th><th class="trend28" title="28 day trend">28D Trend</th><th>Hide<input type="checkbox" id="show-hidden"/></th></tr>'
			+'</thead></table>';
		var $table=$(table).appendTo($wrapper);
		$.post('/stats-get.php', {
			'site_id':site_id
		}, (ret)=>{
			var data=ret.keywords, groups=ret.groups;
			groups.push({
				'id':0,
				'name':' -- '
			});
			var groupNames=[];
			for (var i=0;i<groups.length;++i) {
				groupNames[+groups[i].id]=groups[i].name;
			}
			for (var i=0;i<groups.length;++i) {
				var $tbody=$('<tbody/>').appendTo($table), trs=[];
				var group=groups[i];
				var words=group.name.split(' ');
				for(var k=0;k<words.length;++k) {
					words[k]=/[a-zA-Z]/.test(words[k])
						?new RegExp('(^|[^a-zA-Z0-9])('+words[k]+')($|[^a-zA-Z0-9])')
						:false;
				}
				var $trheader=$('<tr class="category-header"/>');
				$trheader.data('id', group.id);
				var wordslist={};
				$('<td class="keyword"/>').text(group.name).appendTo($trheader);
				var $groupTotal=$('<td class="group-total"/>').text('0').appendTo($trheader), groupTotal=0;
				$('<td class="last_impression"/>').text(group.last_impression).appendTo($trheader);
				$('<td class="clicks"/>').text(group.clicks).appendTo($trheader);
				$('<td class="impressions"/>').text(group.impressions).appendTo($trheader);
				$('<td class="position"/>').text(group.position).appendTo($trheader);
				$('<td class="importance"/>').text(group.importance).appendTo($trheader);
				$('<td class="trend14"/>').appendTo($trheader);
				$('<td class="trend28"/>').appendTo($trheader);
				$('<td class="showhide"/>').append(
					$('<button>hide</button>')
						.click(function() {
							var $this=$(this), type=$this.text(), $trheader=$this.closest('tr');
							var $next=$trheader.next('tr');
							while ($next.length && !$next.hasClass('category-header')) {
								$next.removeClass('category-hide category-show').addClass('category-'+type)
								$next=$next.next('tr');
							}
							type=type=='hide'?'show':'hide';
							$this.text(type);
							if (type=='hide') {
								calculateHighlights();
								calculateTrends();
							}
							return false;
						})
				).appendTo($trheader);
				trs.push($trheader);
				for (var j=0;j<data.length;++j) {
					if (data[j].group_id!=group.id) {
						continue;
					}
					var name=data[j].name;
					var wordssplit=name.split(' ');
					var $tr=$('<tr/>');
					$tr.data('id', data[j].id);
					if (+data[j].hide) {
						$tr.addClass('hide');
					}
					else {
						groupTotal++;
						$groupTotal.text(groupTotal);
						for (var k=0;k<wordssplit.length;++k) {
							if (!wordslist[wordssplit[k]]) {
								wordslist[wordssplit[k]]=0;
							}
							wordslist[wordssplit[k]]++;
						}
					}
					for (var k=0;k<words.length;++k) {
						if (words[k]) {
							name=name.replace(words[k], '$1<span class="fade">$2</span>$3');
						}
					}
					$('<td class="keyword"/>').html(name).appendTo($tr);
					$('<td class="group"/>').data('group', data[j].group_id).text(groupNames[+data[j].group_id]||' -- ').appendTo($tr);
					$('<td class="last_impression"/>').text(data[j].last_seen.replace(/^....-/, '')).appendTo($tr);
					$('<td class="clicks"/>').text(data[j].clicks28).appendTo($tr);
					$('<td class="impressions"/>').text(data[j].impressions28).appendTo($tr);
					$('<td class="position"/>').text((+data[j].position28).toFixed(2)).appendTo($tr);
					$('<td class="importance"/>').text((+data[j].importance).toFixed(2)).appendTo($tr);
					$('<td class="trend14"/>').appendTo($tr);
					$('<td class="trend28"/>').appendTo($tr);
					$('<td class="hide"/>').append($('<input class="hide" type="checkbox"/>').prop('checked', +data[j].hide)).appendTo($tr);
					trs.push($tr);
				}
				var list=[];
				for (var j in wordslist) {
					list.push({
						'name':j,
						'amt':wordslist[j]
					});
				}
				list.sort((a, b)=>{
					return a.amt<b.amt?1:-1;
				});
				var keywords="most common words:\n";
				for (var j=0;j<list.length&&j<10;++j) {
					keywords+=list[j].name+' ('+list[j].amt+")\n";
				}
				$trheader.find('td.keyword').attr('title', keywords);
				$tbody.append(trs);
			}
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
					if ($tr.closest('thead').length) {
						return false;
					}
					if (class_name===undefined || class_name=='keyword' || class_name=='last_impression' || class_name=='hide' || class_name=='group' || class_name=='showhide' || /trend/.test(class_name)) {
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
								var params={
									'id':keyword_id,
									'site_id':site_id,
									'data_type':data_type,
									'type':class_name,
									'days':365
								}
								if (data_type==1) {
									console.error(params);
								}
								$.post('/keyword-getData.php', params, (data)=>{
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
					ret.sort((a, b)=>{
						return a.name.toLowerCase()<b.name.toLowerCase()?-1:1;
					});
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
				calculateTrends();
			}, 1);
		});
		function calculateHighlights() {
			clearTimeout(window.calculateHighlightsTimer);
			window.calculateHighlightsTimer=setTimeout(function() {
				var $trs=$table.find('tr').not('.hide');
				$trs.removeClass('highlight').data('title', '');
				for (var i=1;i<$trs.length;++i) {
					var comments=[], highlight=0;
					var $tr=$($trs[i]);
					if (i<$trs.length-1 && +$tr.find('td.clicks').text() < +$($trs[i+1]).find('td.clicks').text()) {
						comments.push('improve clicks. check how this appears in a Google search and adjust the text in the linked document to make it more obvious that it is the right page');
						highlight++;
					}
					if (i>1 && +$tr.find('td.position').text() > +$($trs[i-1]).find('td.position').text()) {
						comments.push('improve position by learning something new about this keyword\'s subject and writing about it, using the keyword');
						highlight++;
					}
					if (highlight) {
						$tr.addClass('highlight').data('title', comments.join("\n"));
					}
				}
			}, 1000);
		}
		$table.find('thead th').click(function() {
			var idx=$(this).index();
			var ord=$(this).data('ord')=='asc'?'desc':'asc';
			$(this).data('ord', ord);
			var order=[];
			var $tbodies=$table.find('tbody');
			for (var i=0;i<$tbodies.length;++i) {
				order[i]={
					'cur':i,
					'val':$($tbodies[i]).find('tr:first-child td:nth-child('+(idx+1)+')').text()
				};
				if (order[i].val== +order[i].val) {
					order[i].val=+order[i].val;
				}
			}
			order.sort((a, b)=>{
				return ord=='asc'
					?(a.val<b.val?-1:1)
					:(b.val<a.val?-1:1);
			});
			for (var i=0;i<order.length;++i) {
				$table.append($tbodies[order[i].cur]);
			}
		});
	});
	$.post('/sites-list.php', (sites)=>{
		var opts=[];
		for (var i=0;i<sites.length;++i) {
			opts.push($('<option value="'+sites[i].id+'"/>').text(sites[i].name).data('authuser', sites[i].authuser));
		}
		$site.append(opts);
	});
});
