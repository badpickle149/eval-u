"use strict";
(function () {

  // load in csv data
  var data = "";
  d3.csv("../data/data2.csv")
    .then(function(response) {
      data = response;
    })
    .catch(alert);

  // assign button functionality when page is loaded
  window.onload = function() {
    $('#search-bar-home form a').click(query);
    $('nav button').click(function () {
      let hamburgerMenu = $('nav div.collapse');
      if (hamburgerMenu.hasClass('show')) {
        hamburgerMenu.removeClass('show');
      } else {
        hamburgerMenu.addClass('show');
      }
    });
    if ($(window).width() >= 1200) {
      $('form a').removeClass('mt-3');
    }
    $('#homeLink').click(function() {
      switchPage('home');
    });
    $('#reviewLink').click(function() {
      switchPage('review');
    });
    $('#review-submit').click(addNewReview);
  }

  // passes query information to 'search' function
  function query() {
    let query = $('form input')[0].value;
    $('#intro-statement').addClass('hidden');
    search(query);
    $('#search-bar-home form input')[0].value = "";
  }

  // resets the page to original state
  function clearResults() {
    let toBeHidden = $('#search-results, #card-deck, #summary');
    toBeHidden.addClass('hidden');
    let toBeCleared = $('#search-results h4, #search-results div, #card-deck, #summary');
    toBeCleared.empty();
    let toBeRemoved = $('main h2, #summary-title, #card-deck-title');
    toBeRemoved.remove();
    let toBeUnwrapped = $('#summary, #card-deck');
    toBeUnwrapped.unwrap();
  }

  /*
  * @param {query} the class or prof selected after searching
  * creates bootstrap cards with descriptions of each review
  * fills #card-deck with cards
  */
  function fillCards(query) {
    let type = query[0];
    let match = query[1];
    $('#search-results').addClass('hidden');
    let rows = returnRowsWhere(match);
    let cardDeck = $('#card-deck');
    cardDeck.wrapAll(`<div class="container"></div>`);
    cardDeck.removeClass('hidden');
    $('<div id="card-deck-title" class="container text-center mb-2"><h2>Reviews</h2></div>').insertBefore(cardDeck);
    for (let i = 0; i < rows.length; i++) {
      cardDeck.append(constructCard(rows[i], type));
    }
    if (type == "course_name") {
      getSummary(rows, "course");
    } else {
      getSummary(rows, "proffessor");
    }
  }

  // gets query results and displays them
  function search(query) {
    clearResults();
    $('#text-area p').remove();
    let results = getMatches(query);
    displayMatchResults(query, results);
  }

  // returns results of search matching the query
  function getMatches(query) {
    let regex = new RegExp(query, 'i');
    let results = [];
    let matchCategories = ['prof_name', 'course_name'];
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < matchCategories.length; j++) {
        let val = data[i][matchCategories[j]];
        let arr = [matchCategories[j], val];
        if (val.match(regex)) {
          if (!checkResultsValues(results, arr)) {
            results.push([matchCategories[j], val]);
          }
        }
      }
    }
    return results;
  }

  // check there are no duplicate values
  function checkResultsValues(results, arr) {
    for (let i = 0; i < results.length; i++) {
      if (results[i][0] == arr[0] && results[i][1] == arr[1]) {
        return true;
      }
    }
    return false;
  }

  // shows results of query on the page
  function displayMatchResults(query, matches) {
    let resultsContainer = $('#search-results');
    resultsContainer.find('h4').text(query);
    resultsContainer.removeClass('hidden');
    if (matches.length == 0) {
      resultsContainer.find('div').text("We didn't find anything for " + query);
    } else {
      let matchList = resultsContainer.find('div');
      for (let i = 0; i < matches.length; i++) {
        let matchListItem = $(`<a class="text-center"></a>`);
        matchListItem.text(matches[i][1]);
        matchListItem.on('click', () => {
          $('#card-deck').empty();
          fillCards(matches[i]);
        });
        matchList.append(matchListItem);
      }
    }
  }

  // returns rows matches of the query in the csv file
  function returnRowsWhere(query) {
    let rows = [];
    let regex = new RegExp(query,'i');
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data.columns.length; j++) {
        if (data[i][data.columns[j]].match(regex)) {
          rows.push(data[i]);
        }
      }
    }
    return rows;
  }

  // constructs a review card
  function constructCard(row, type) {
    let card =
    $(`<div class="card">
      <div class="card-body">
        <h5 class="card-title"></h5>
        <h6 class="card-subtitle"></h6>
        <p class="card-text"></p>
      </div>
      <ul class="list-group list-group-flush">
        <li class="list-group-item overall-rating">Overall Course Rating<span class="float-right rating"></span></li>
      </ul>
    </div>`);
    card.find('h6').text("review by " + row.username);
    if (row.comment != "") {
      let p = $(`<p class="card-text"></p>`);
      p.text(row.comment);
      card.find('.card-body').append(p);
    }
    let title = card.find('h5');
    if (type == "course_name") {
      title.text(row['prof_name']);
    } else { // search was for a professor
      title.text(row['course_name']);
    }
    let ul = card.find('ul');
    ul.find('.overall-rating').find('span').text(row['course_rating_overall']);
    if (row['prof_rating'] != '') {
      let profRating = $('<li class="list-group-item prof-rating">Professor\'s Contribution<span class="float-right rating"></span></li>');
      profRating.find('span').text(row['prof_rating']);
      ul.append(profRating);
    }
    if (row['course_difficulty'] != '') {
      let diffLi = $('<li class="list-group-item course-difficulty">Course Difficulty<span class="float-right rating"></span></li>');
      diffLi.find('span').text(row['course_difficulty']);
      ul.append(diffLi);
    }
    return card;
  }

  // build summary data
  function getSummary(rows, type) {
    let summary = {};
    if (rows.length == 1) {
      let initial = rows[0];
      if (type == "course") {
        summary['bestProf'] = initial['prof_name'];
        summary['avg_course_rating'] = initial['course_rating_overall'];
        summary['avg_difficulty'] = initial['course_difficulty'];
      } else {
        summary['avg_prof_rating'] = initial['prof_rating'];
        summary['prof_courses'] = {'name' : 'prof_name', 'rating' : initial['course_rating_overall']};
      }
    } else {
      if (type == "course") {
        let courseRatingOverall = [];
        let courseDifficulty = [];
        let profsToReviews = {};
        for (let i = 0; i < rows.length; i++) {
          courseRatingOverall.push(rows[i]['course_rating_overall']);
          courseDifficulty.push(rows[i]['course_difficulty']);
          let profName = rows[i]['prof_name'];
          if (!(profName in profsToReviews)) {
            profsToReviews[profName] = [rows[i]['prof_rating']];
          } else { // prof_name exists as key in profsToReviews
            profsToReviews[profName].push(rows[i]['prof_rating']);
          }
        }
        summary['avg_course_rating'] = d3.mean(courseRatingOverall).toPrecision(3);
        summary['avg_difficulty'] = d3.mean(courseDifficulty).toPrecision(3);
        summary['bestProf'] = caculateBestProf(profsToReviews);
      } else { // the search is for a professor
        let courses = {};
        let profRatingsAll = [];
        for (let i = 0; i < rows.length; i++) {
          profRatingsAll.push(rows[i]['prof_rating']);
          let courseName = rows[i]['course_name'];
          if (!(courseName in courses)) {
            courses[courseName] = [rows[i]['prof_rating']];
          } else {  // course already exists as key in courses
            courses[courseName].push(rows[i]['prof_rating']);
          }
        }
        summary['avg_prof_rating'] = d3.mean(profRatingsAll).toPrecision(3);
        summary['prof_courses'] = formatProfCourses(courses);
      }

    }
    if (type == "course") {
      displaySummary(summary, rows[0]['course_name']);
    } else { // search is for professor
      displaySummary(summary, rows[0]['prof_name']);
    }
  }

  // display summary on page
  function displaySummary(summary, title) {
    let categoryDisplayNames = {
      'bestProf' : "Highest Rated Professor",
      'avg_prof_rating' : "Average Course Rating",
      'avg_difficulty' : "Course Difficulty",
      'avg_course_rating' : "Course Rating Overall"
    };
    let summaryHTML = $(`
      <div class="card">
        <div class="card-body text-center">
          <h5 class="card-title"></h5>
          <h6 class="card-subtitle">Summary</h6>
        </div>
        <ul class="list-group list-group-flush text-center">

        </ul>
      </div>
    `);
    summaryHTML.find('h5').text(title);
    let summaryHTMLList = summaryHTML.find('ul');
    for (let key in summary) {
      if (key == 'prof_courses') {
        for (let i = 0; i < summary['prof_courses'].length; i++) {
          let course = summary['prof_courses'][i];
          let displayName = course.name;
          let listItemHTML = $('<li class="list-group-item"><span class="summary-list-title"></span></li>');
          listItemHTML.find('span').text(title + "'s Rating For " + displayName);
          let listItemSpan = $('<span class="rating"></span>');
          listItemSpan.text(course.rating);
          listItemHTML.append(listItemSpan);
          summaryHTMLList.append(listItemHTML);
        }
      } else {
        let displayName = categoryDisplayNames[key];
        let listItemHTML = $('<li class="list-group-item"><span class="summary-list-title"></span></li>');
        listItemHTML.find('span').text(displayName);
        let listItemSpan = $('<span class="rating"></span>');
        listItemSpan.text(summary[key]);
        listItemHTML.append(listItemSpan);
        summaryHTMLList.append(listItemHTML);
      }
    }
    let pageSummaryHTML = $('#summary');
    $('<div id="summary-title" class="container mt-5 text-center"><h2>Summary</h2></div>').insertBefore(pageSummaryHTML);
    pageSummaryHTML.removeClass('hidden');
    pageSummaryHTML.append(summaryHTML);
    pageSummaryHTML.wrapAll('<div class="container"></div>');
  }

  // get the proffessor with the best reviews for a course
  function caculateBestProf(profsToReviews) {
    let max = 0;
    let bestProf = "";
    for (let key in profsToReviews) {
      let profsReviews = profsToReviews[key];
      let avg = d3.mean(profsReviews).toPrecision(3);
      if (avg > max) {
        max = avg;
        bestProf = key;
      }
    }
    return bestProf;
  }

  // formats courses object
  function formatProfCourses(courses) {
    let formattedCourses = [];
    for (let key in courses) {
      let courseSummary = {};
      courseSummary.name = key;
      courseSummary.rating = d3.mean(courses[key]).toPrecision(3);
      formattedCourses.push(courseSummary);
    }
    return formattedCourses;
  }

  // switches between add a review page and home page
  function switchPage(target) {
    clearResults();
    if (target == "home") {
      $('#homeLink').addClass('active');
      $('#reviewLink').removeClass('active');
      $('#intro-statement, #search-bar-home, #text-area').removeClass('hidden');
      $('#add-review').addClass('hidden');
    } else { // target is link page
      $('#reviewLink').addClass('active');
      $('#homeLink').removeClass('active');
      $('#summary, #card-deck, #intro-statement, #search-results, #search-bar-home, #text-area').addClass('hidden');
      $('#add-review').removeClass('hidden');
    }
    $('#review-submit-response').addClass('hidden');
    $('nav div.collapse').removeClass('show');
  }

  // adds a new review
  function addNewReview() {
    let fields = $('#add-review input');
    let newRow = [];
    for (let i = 0; i < fields.length; i++) {
      if (fields[i].value == "") {
        throw new Error("One or more fields are not filled in");
      }
      newRow.push(fields[i].value);
      fields[i].value = "";
    }
    newRow = formatNewRow(newRow);
    data.push(newRow);
    $('#review-submit-response').removeClass('hidden');
    $('#add-review').addClass('hidden');
  }

  // format new review to match csv row style
  function formatNewRow(newRow) {
    let formattedData = {};
    formattedData['username'] = newRow[0];
    formattedData['course_rating_overall'] = newRow[3];
    formattedData['prof_rating'] = newRow[4];
    formattedData['prof_name'] = newRow[2];
    formattedData['course_difficulty'] = newRow[5];
    formattedData['comment'] = newRow[7];
    formattedData['course_name'] = newRow[1].toUpperCase();
    formattedData['course_content'] = newRow[6];
    return formattedData;
  }

})();
