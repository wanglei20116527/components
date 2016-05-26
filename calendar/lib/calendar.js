'use strict';

(function(window, document, undefined){

function Type(){};

Type.isType = function( type ){
	return function( obj ){
		return Object.prototype.toString.call(obj) === '[object ' + type + ']';
	}
};

Type.isDate = Type.isType('Date');
Type.isNum  = Type.isType('Number');

function query(selector, context){
	context = context || document;

	return context.querySelector(selector);
}

function queryAll(selector, context){
	context = context || document;

	return context.querySelectorAll(selector);
}

function getTranslateX(node){
	var style     = window.getComputedStyle(node, null)
	  , transform = style.transform
	  , regExp    = /matrix\(((?:\-\d)?\d*\.?\d*,\s*){4}((?:\-\d)?\d*\.?\d*),[\s\S]*\)/
	  , x         = 0
	  , tmp;

	if( transform ){
		tmp = regExp.exec(transform);
		x = tmp ? tmp[2] : 0;
	}
	
	return parseInt(x);
}

function removeNodes(nodes){
	if( nodes.length == null ){
		nodes = [nodes];
	}

	for( var i = 0, len = nodes.length; i < len; ++i ){
		 var node = nodes[i];
		 node.parentNode.removeChild(node);
	}
}

function hasClass(node, className){
	className = className.split(' ');

	for( var i = 0, len = className.length; i < len; ++i ){
		 if( node.className.indexOf(className[i]) < 0 ){
		 	 return false;
		 }
	}

	return true;
}

function addClass(nodes, className){
	if( nodes.length == null ){
		nodes = [nodes];
	}

	className = className.split(' ');

	for( var i = 0, len = nodes.length; i < len; ++i ){
		 var node     = nodes[i];
		 var tmpClass = node.className;

		 for( var j = 0, len1 = className.length; j < len1; ++j ){
		 	  if( tmpClass.indexOf(className[j]) == -1 ){
		 	  	  tmpClass += ' ' + className[j]; 
		 	  }
		 }

		 node.className = tmpClass;
	}
}

function removeClass(nodes, className){
	if( nodes.length == null ){
		nodes = [nodes];
	}

	className = className.split(' ');

	for( var i = 0, len = nodes.length; i < len; ++i ){
		 var node     = nodes[i]
		 ,   tmpClass = node.className;

		 for( var j = 0, len1 = className.length; j < len1; ++j ){
		 	  tmpClass = tmpClass.replace( className[j], '');
		 }

		 node.className = tmpClass;
	}
}

function getWidth(node){
	return parseInt(window.getComputedStyle(node, null).width);
}

function toArray(likeArr){
	return Array.prototype.slice.call(likeArr);
}

window.Calendar = function($el, date, selectedDate){
	if( !$el || !$el.nodeType || $el.nodeType != 1 ){
		throw new Error('the first param must be a node');
	}

	if( date && !Type.isDate(date) ){
		throw new Error('type invalid: second parma must be a Date object');
	}

	if( selectedDate && !Type.isDate(selectedDate) ){
		throw new Error('type invalid: second parma must be a Date object');
	}

	this._el   = $el;
	this._date = date  || (new Date());

	this._selectedDate     = selectedDate || new Date(this._date);
	this._prevSelectedDate = new Date(this._selectedDate);

	this._init();
}

Calendar.prototype._init = function(){
	this._initLayout();
	this._initDate();
	this._initListener();
};

Calendar.prototype._initDate = function(){
	var $curtMonthPane = this._getMonthPane('middle')
	  , $prevMonthPane = this._getMonthPane('left')
	  , $nextMonthPane = this._getMonthPane('right')

	  , today         = this._date
	  , curtMonthDate = this._selectedDate
	  , prevMonthDate = this.getPrevMonthDate(curtMonthDate)
	  , nextMonthDate = this.getNextMonthDate(curtMonthDate);

	this._initMonthPane($curtMonthPane, curtMonthDate, today);
	this._initMonthPane($prevMonthPane, prevMonthDate, today);
	this._initMonthPane($nextMonthPane, nextMonthDate, today);
};

Calendar.prototype._initLayout = function(){
	var $el = this._el
	  , $calendar = document.createElement('div');

	$calendar.className = 'wl calendar';

	this._initHead($calendar);
	this._initBody($calendar);

	$el.appendChild($calendar);
}

Calendar.prototype._initHead = function($parent){
	var $head = document.createElement('div')
	  , $wrap = document.createElement('ul');
	
	$head.className = 'wl head';
	$wrap.className = 'wl wrap clearfix';

	['日', '一', '二', '三', '四', '五', '六'].forEach(function(label){
		var $label = document.createElement('li');
		
		$label.className = 'wl item';
		$label.innerHTML = ['<span>', label, '</span>'].join('');

		$wrap.appendChild($label);
	});

	$head.appendChild($wrap);
	$parent.appendChild($head);
};

Calendar.prototype._getBody = function(){
	return queryAll('.wl.body', this._el) || null;
};

Calendar.prototype._initBody = function($parent){
	var $body = document.createElement('div')
	  , $pane

	  , num = 3
	  , classNames = ['left', 'middle', 'right'];

	$body.className = 'wl body';

	for( var i = 0; i <  num; ++i ){
	  	 $pane = this._createMonthPane( [ classNames[i] ] );

	  	 $body.appendChild($pane);
	}

	$parent.appendChild($body);
};

Calendar.prototype._createMonthPane = function(className){
	var $pane = document.createElement('div')
	  , $mask = document.createElement('div')
	  , $wrap = document.createElement('div')
	  , $row
	  , $col

	  , row = 6
	  , col = 7;
	
	className = className || '';

	$pane.className = 'wl month-pane ' + className;
	$mask.className = 'wl mask';
	$wrap.className = 'wl wrap clearfix';

	for( var i = 0; i < row; ++i ){
		 $row = document.createElement('ul');
		 $row.className = 'wl row clearfix';

		 for( var j = 0, col = 7; j < col; ++j ){
		 	  $col = document.createElement('li');
		 	  $col.className = 'wl col';

		 	  $row.appendChild($col);
		 }

		 $wrap.appendChild($row);
	}

	$pane.appendChild($mask);
	$pane.appendChild($wrap);

	return $pane;
};

Calendar.prototype._updateMonthPane = function($monthPane, curtDate, today){
	var $dateCells = this._getDateCells($monthPane)

	  , year  = curtDate.getFullYear()
	  , month = curtDate.getMonth()
	  , day   = curtDate.getDate()
	  , dates = this._getDates(curtDate);

	for( var i = 0, len = $dateCells.length; i < len; ++i ){
		 var $dateCell = $dateCells[i]

		   , date      = dates[i]
		   , className = 'wl col';

		 $dateCell.className = '';

		 if( date.getMonth() == month ){
		 	 className += ' active';
		 
		 }else {
		 	 className += ' inactive';
		 }

		 if( date.getDate() == day && date.getMonth() == month ){
		 	 className += ' selected';
		 }

		 if( date.getFullYear() === today.getFullYear() &&
		 		date.getMonth() === today.getMonth() &&
		 			date.getDate() === today.getDate() ){
		 	 className += ' today';
		 }

		 $dateCell.className = className;

		 this._updateDateCell($dateCell, date);
	}

	return this;
};

Calendar.prototype._initMonthPane = function($monthPane, curtDate, today){
	return this._updateMonthPane($monthPane, curtDate, today);
};

Calendar.prototype._initListener = function(){
	var $curtMonthPane = this._getMonthPane('middle')
	  , $prevMonthPane = this._getMonthPane('left')
	  , $nextMonthPane = this._getMonthPane('right')

	  , touchStartX = 0
	  , startTime   = 0

	  , that = this;

	$curtMonthPane.addEventListener('touchstart' , touchstart , false);
	$curtMonthPane.addEventListener('touchend'   , touchend   , false);
	$curtMonthPane.addEventListener('touchcancel', touchcancel, false);

	$prevMonthPane.addEventListener('touchstart' , touchstart , false);
	$prevMonthPane.addEventListener('touchend'   , touchend   , false);
	$prevMonthPane.addEventListener('touchcancel', touchcancel, false);

	$nextMonthPane.addEventListener('touchstart' , touchstart , false);
	$nextMonthPane.addEventListener('touchend'   , touchend   , false);
	$nextMonthPane.addEventListener('touchcancel', touchcancel, false);

	$curtMonthPane.addEventListener('click' , click , false);
	$prevMonthPane.addEventListener('click' , click , false);
	$nextMonthPane.addEventListener('click' , click , false);

	function touchstart(e){
		var touch = e.targetTouches[0];
		
		touchStartX = touch.clientX;
		startTime   = Date.now();
	}

	function touchend(e){
		var $curtMonthPane = that._getMonthPane('middle')
		  , $node

		  , touch    = e.changedTouches[0]
		  , offset   = touch.clientX - touchStartX
		  , interval = Date.now() - startTime
		  , speed    = Math.abs(offset) / interval * 1000
		  , curtDate = that._selectedDate;

		e.preventDefault();

		if( interval <= 250 && Math.abs(offset) < 30 ){
			$node = e.target;

			while( $node && $node != this ){
				 var tmpClass = $node.className;
				 if( hasClass($node, 'wl col') ){
				 
				 	 
				 	 curtDate = ($node.__data__ || {}).date || new Date();

				 	 that.update(curtDate, true);
				 	 break;
				 }

				 $node = $node.parentNode;
			}

			return;
		}

		if( Math.abs(speed) >= 400 && interval <= 250 ){
			if( offset > 0 ){
				that.displayPrevMonth(true);

			} else {
				that.displayNextMonth(true);
			}
			return;
		}

		touchStartX = 0;
		startTime   = 0;
	}

	function touchcancel(e){
		e.preventDefault();

		touchStartX = 0;
		startTime   = 0;
	}

	function click(e){
		var $node    = e.target
		  , curtDate = null;

		while( $node && $node != this ){
			var tmpClass = $node.className;
			if( hasClass($node, 'wl col') ){
				curtDate = ($node.__data__ || {}).date || new Date();

				that.update(curtDate, true);
				break;
			}

			$node = $node.parentNode;
		}
	}
}

Calendar.prototype._getMonthPane = function(labelStr){
	labelStr = '.wl.month-pane.' + labelStr;
	return query(labelStr, this._el);
};

Calendar.prototype._getCurtMonthPane = function(){
	return queryAll('.wl.month-pane.curt', this._el);
};

Calendar.prototype._getDateCells = function($monthPane){
	return toArray(queryAll('.wl.col', $monthPane) || []);
};

Calendar.prototype._updateDateCell = function($dateCell, date, className){
	var $content   = document.createElement('div')
	  , $date      = document.createElement('span')
	  , $lunarDate = document.createElement('span');

	$content.className  = 'date-cell';
	$date.className      = 'date';
	$lunarDate.className = 'lunar-date';

	$dateCell.innerHTML  = '';
	$date.innerHTML      = date.getDate();
	$lunarDate.innerHTML = '立夏';

	$content.appendChild($date);
	$content.appendChild($lunarDate);
	$dateCell.appendChild($content);

	$dateCell.__data__ = {
		date: date,
	};
};

Calendar.prototype._getDates = function(date){
	var row           = 6
	  , col           = 7
	  , len           = row * col
	  , dates         = new Array(len)

	  , curtMonthDate 
	  , prevMonthDate
	  , nextMonthDate

	  , curtMonthYear
	  , curtMonthMonth
	  , prevMonthYear
	  , prevMonthMonth
	  , nextMonthYear
	  , nextMonthMonth
	  
	  , curtMonthNum
	  , prevMonthNum

	  , firstDay;

	curtMonthYear  = date.getFullYear();
	curtMonthMonth = date.getMonth();
	curtMonthDate  = new Date(curtMonthYear, curtMonthMonth, 1);
	curtMonthNum   = this.getNumOfDays(curtMonthYear, curtMonthMonth);

	firstDay = curtMonthDate.getDay();

	for( var i = 0; i < curtMonthNum; ++i ){
		 dates[i + firstDay] = new Date(curtMonthYear, curtMonthMonth, i + 1); 
	}

	prevMonthDate  = this.getPrevMonthDate(curtMonthDate);
	prevMonthYear  = prevMonthDate.getFullYear();
	prevMonthMonth = prevMonthDate.getMonth();
	prevMonthNum   = this.getNumOfDays(prevMonthYear, prevMonthMonth);

	for( var i = 0; i < firstDay; ++i ){
		 dates[i] = new Date(prevMonthYear, prevMonthMonth, prevMonthNum - firstDay + i + 1);
	}

	nextMonthDate  = this.getNextMonthDate(curtMonthDate);
	nextMonthYear  = nextMonthDate.getFullYear();
	nextMonthMonth = nextMonthDate.getMonth();
	for( var i = curtMonthNum + firstDay; i < len; ++i ){
		 dates[i] = new Date(nextMonthYear, nextMonthMonth, i - curtMonthNum - firstDay + 1);
	}
	
	return dates;
};

Calendar.prototype.isLeapYear = function(year){
	var tmp1 = year / 100
	  , tmp2 = year / 4;

	return parseInt(tmp1) !== tmp1 && parseInt(tmp2) === tmp2;
};

Calendar.prototype.getNumOfDays = function(year, month){
	var num = [
		31, 28, 31, 30, 31, 30,
		31, 31, 30, 31, 30, 31
	][month];

	if( this.isLeapYear(year) && month == 1){
		++num;
	}

	return num;
};

Calendar.prototype.getPrevMonthDate = function(date){
	var year  = date.getFullYear()
	  , month = date.getMonth()
	  , day   = date.getDate()
	  , num;

	--month;

	if( month < 0 ){
		--year;
		month = 11;
	}

	num = this.getNumOfDays(year, month);

	if( day > num ){
		day = num;
	}

	return new Date(year, month, day);
};

Calendar.prototype.getNextMonthDate = function(date){
	var year  = date.getFullYear()
	  , month = date.getMonth()
	  , day   = date.getDate()
	  , num;

	++month;

	if( month >= 12 ){
		++year;
		month = 0;
	}

	num = this.getNumOfDays(year, month);

	if( day > num ){
		day = num;
	}

	return new Date(year, month, day);
};

Calendar.prototype.update = function(dateToSelect, animate){
	var $curtMonthPane = this._getMonthPane('middle')
	  , $prevMonthPane = this._getMonthPane('left')
	  , $nextMonthPane = this._getMonthPane('right')
	  , $tmpPane       = null

	  , cMD   = this._selectedDate
	  , cMY   = cMD.getFullYear()
	  , cMM   = cMD.getMonth()

	  , pMD   = this.getPrevMonthDate(cMD)
	  , pMY   = pMD.getFullYear()
	  , pMM   = pMD.getMonth()

	  , nMD   = this.getNextMonthDate(cMD)
	  , nMY   = nMD.getFullYear()
	  , nMM   = nMD.getMonth()

	  , tMD   = dateToSelect
	  , tMY   = tMD.getFullYear()
	  , tMM   = tMD.getMonth()

	  , tPMD  = this.getPrevMonthDate(tMD)
	  , tNMD  = this.getNextMonthDate(tMD)

	  , today = this._date

	  , animate  = animate || false

	  , offset   = 0
	  , width    = 0
	  , duration = 0

	  , that     = this;

	if( (tMY !== pMY || tMM !== pMM) &&
			(tMY !== nMY || tMM !== nMM) &&
				(tMY !== cMY || tMM !== cMM) ){
		animate = false;
	} 

	if( animate ){
		offset   = getTranslateX($curtMonthPane);
		duration = getDuration(Math.abs(offset));
	}

	$prevMonthPane.style.transition = '';
	$curtMonthPane.style.transition = '';
	$nextMonthPane.style.transition = '';

	$prevMonthPane.style.webkitTransition = '';
	$curtMonthPane.style.webkitTransition = '';
	$nextMonthPane.style.webkitTransition = '';

	if( tMY === cMY && tMM == cMM ){
		if( animate ){
			offset   = getTranslateX($curtMonthPane);
			duration = getDuration(Math.abs(offset));
		
		} else {
			duration = 0;
		}

		$curtMonthPane = $curtMonthPane;
	    $prevMonthPane = $prevMonthPane;
	    $nextMonthPane = $nextMonthPane;

	    $prevMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';
		$curtMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';
		$nextMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';

		$prevMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';
		$curtMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';
		$nextMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';

	} else if( tMY === pMY && tMM == pMM ){
		if( animate ){
			width    = getWidth($curtMonthPane);
			offset   = width - Math.abs(getTranslateX($curtMonthPane));
			duration = getDuration(Math.abs(offset));
		
		} else {
			duration = 0;
		}

		$tmpPane       = $nextMonthPane;
		$nextMonthPane = $curtMonthPane;
		$curtMonthPane = $prevMonthPane;
	    $prevMonthPane = $tmpPane;

	    $prevMonthPane.style.transform       = 'translate3d(-100%, 0, 0)';
	    $prevMonthPane.style.webkitTransform = 'translate3d(-100%, 0, 0)';

	    $prevMonthPane.style.transition = 'transform 0s ease-in-out';
		$curtMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';
		$nextMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';

		$prevMonthPane.style.webkitTransition = '-webkit-transform 0s ease-in-out';
		$curtMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';
		$nextMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';
	
	} else if( tMY === nMY && tMM === nMM ){
		if( animate ){
			width    = getWidth($curtMonthPane);
			offset   = width - Math.abs(getTranslateX($curtMonthPane));
			duration = getDuration(Math.abs(offset));
		
		} else {
			duration = 0;
		}

		$tmpPane       = $prevMonthPane;
		$prevMonthPane = $curtMonthPane;
		$curtMonthPane = $nextMonthPane;
	    $nextMonthPane = $tmpPane;

	    $nextMonthPane.style.transform       = 'translate3d(100%, 0, 0)';
	    $nextMonthPane.style.webkitTransform = 'translate3d(100%, 0, 0)';

	    $prevMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';
		$curtMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';
		$nextMonthPane.style.transition = 'transform 0s ease-in-out';

		$prevMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';
		$curtMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';
		$nextMonthPane.style.webkitTransition = '-webkit-transform 0s ease-in-out';

	
	} else {
		duration = 0;

		$curtMonthPane = $curtMonthPane;
	    $prevMonthPane = $prevMonthPane;
	    $nextMonthPane = $nextMonthPane;

	    $prevMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';
		$curtMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';
		$nextMonthPane.style.transition = 'transform ' + duration + 's ease-in-out';

		$prevMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';
		$curtMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';
		$nextMonthPane.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in-out';

	}

	$prevMonthPane.style.willChange = 'transform';
	$curtMonthPane.style.willChange = 'transform';
	$nextMonthPane.style.willChange = 'transform';

	removeClass($curtMonthPane, 'left middle right');
	removeClass($prevMonthPane, 'left middle right');
	removeClass($nextMonthPane, 'left middle right');

	addClass($curtMonthPane, 'middle');
	addClass($prevMonthPane, 'left');
	addClass($nextMonthPane, 'right');

	setTimeout(function(){
		$prevMonthPane.style.transform = 'translate3d(-100%, 0, 0)';
		$curtMonthPane.style.transform = 'translate3d(0, 0, 0)';
		$nextMonthPane.style.transform = 'translate3d(100%, 0, 0)';

		$prevMonthPane.style.webkitTransform = 'translate3d(-100%, 0, 0)';
		$curtMonthPane.style.webkitTransform = 'translate3d(0, 0, 0)';
		$nextMonthPane.style.webkitTransform = 'translate3d(100%, 0, 0)';

		setTimeout(function(){
			that._selectedDate = tMD;

			that._updateMonthPane($prevMonthPane, tPMD, today);
			that._updateMonthPane($curtMonthPane, tMD , today);
			that._updateMonthPane($nextMonthPane, tNMD, today);

			$prevMonthPane.style.willChange = 'auto';
			$curtMonthPane.style.willChange = 'auto';
			$nextMonthPane.style.willChange = 'auto';
		}, duration);
	}, 0);

	function getDuration(offset){
		return Math.abs(offset) / 800;
	}
};

Calendar.prototype.displayPrevMonth = function(animate){
	var curtMonthDate = this._selectedDate
	  , prevMonthDate = this.getPrevMonthDate(curtMonthDate);
	
	return this.update(prevMonthDate, animate || false);
};

Calendar.prototype.displayNextMonth = function(animate){
	var curtMonthDate = this._selectedDate
	  , nextMonthDate = this.getNextMonthDate(curtMonthDate);
	
	return this.update(nextMonthDate, animate || false);
};


})(window, document);