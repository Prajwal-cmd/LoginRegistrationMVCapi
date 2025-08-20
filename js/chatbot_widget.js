
/* js/chatbot_widget.js
   Floating click-only Q&A widget.
   Behavior:
    - Two states: open / closed
    - When opened -> fresh conversation: top-level questions fetched
    - When closed -> history cleared
    - User clicks a quick reply -> user bubble appended (right),
      then bot response appended (left).
*/

(function ($) {
    "use strict";

    var apiBase = (function () {
        var el = document.getElementById('hdnApiBaseUrl');
        return el ? el.value : '/api/';
    })();

    // DOM elements
    var $widget, $toggle, $window, $closeBtn, $homeBtn, $messages, $chatTitle;
    

    // Phrases you want to cycle
    let phraseIndex = 0;
    const headerPhrases = [
        "Help Assistant",
        "How may I help you?",
        "Ask me about admissions",
        "Quick support at your fingertips"
    ];

    function init() {
        $widget = $('#chatWidget');
        $toggle = $('#chatToggleBtn');
        $window = $('#chatWindow');
        $closeBtn = $('#chatCloseBtn');
        $homeBtn = $('#chatHomeBtn');
        $messages = $('#chatMessages');
        $chatTitle = $('#chatTitle');

        setInterval(() => {
            $chatTitle.addClass("fade-out");
            setTimeout(() => {
                phraseIndex = (phraseIndex + 1) % headerPhrases.length;
                $chatTitle.text(headerPhrases[phraseIndex]);
                $chatTitle.removeClass("fade-out");
            }, 800);
        }, 4000); // change phrase every 4 seconds

        
        

        // initial state closed
        $widget.addClass('closed').attr('aria-hidden', 'true');
        $window.attr('aria-hidden', 'true');

        // handlers
        $toggle.on('click', openWidget);
        $closeBtn.on('click', closeWidget);
        $homeBtn.on('click', showHomeOptions);

        // quick replies (delegated)
        $widget.on('click', '.chat-quick-reply', function () {
            var $btn = $(this);
            var nodeId = $btn.data('id');
            var text = $btn.text();
            handleUserSelection(nodeId, text);
        });
    }

    function openWidget() {
        resetConversation();

        $widget.removeClass('closed').attr('aria-hidden', 'false');
        $window.attr('aria-hidden', 'false');

        fetchRootQuestions();
    }

    function closeWidget() {
        $widget.addClass('closed').attr('aria-hidden', 'true');
        $window.attr('aria-hidden', 'true');

        resetConversation();
    }

    function resetConversation() {
        $messages.empty();
    }

    function fetchRootQuestions() {
        $.ajax({
            url: apiBase + 'chatbot/questions',
            method: 'GET',
            success: function (data) {
                appendBotOptions("Hi! What can I help you with today?", data);
            },
            error: function () {
                appendBotText("Sorry, failed to load options. Try again later.");
            }
        });
    }

    function handleUserSelection(nodeId, text) {
        appendUserText(text);

        var $typing = appendBotTyping();

        $.ajax({
            url: apiBase + 'chatbot/question/' + encodeURIComponent(nodeId),
            method: 'GET',
            success: function (data) {
                $typing.remove();

                if (data && data.answer !== undefined && data.answer !== null) {
                    appendBotText(data.answer);
                    fetchRootQuestions();
                } else if (Array.isArray(data)) {
                    appendBotOptions(null, data);
                } else {
                    appendBotText("No data available for this selection.");
                    fetchRootQuestions();
                }
            },
            error: function () {
                $typing.remove();
                appendBotText("Sorry, something went wrong. Try another option.");
                fetchRootQuestions();
            }
        });
    }

    function appendUserText(text) {
        var $wrap = $('<div class="msg user"></div>');
        var $bubble = $('<div class="bubble"></div>').text(text);
        $wrap.append($bubble);
        $messages.append($wrap);
        scrollToBottom();
    }

    function appendBotText(text) {
        var $wrap = $('<div class="msg bot"></div>');

        // 1. Process the text to convert URLs into links
        var linkedText = linkify(text);

        // 2. Use .html() instead of .text() to render the links
        var $bubble = $('<div class="bubble"></div>').html(linkedText);

        $wrap.append($bubble);
        $messages.append($wrap);
        scrollToBottom();
    }

    function appendBotTyping() {
        var $wrap = $('<div class="msg bot typing"></div>');
        var $bubble = $('<div class="bubble"></div>').text('...');
        $wrap.append($bubble);
        $messages.append($wrap);
        scrollToBottom();
        return $wrap;
    }

    function appendBotOptions(titleText, children) {
        if (titleText) appendBotText(titleText);

        var $wrap = $('<div class="msg bot"></div>');
        var $bubble = $('<div class="bubble"></div>');
        var $qr = $('<div class="chat-quick-replies" role="list"></div>');

        if (!children || !children.length) {
            $qr.append($('<div>No options available.</div>'));
        } else {
            children.forEach(function (c) {
                var $btn = $('<button class="chat-quick-reply" type="button"></button>');
                $btn.text(c.text);
                $btn.attr('data-id', c.id);
                $qr.append($btn);
            });
        }

        $bubble.append($qr);
        $wrap.append($bubble);
        $messages.append($wrap);
        scrollToBottom();
    }

    function showHomeOptions() {
        resetConversation();
        fetchRootQuestions();
    }

    function scrollToBottom() {
        setTimeout(function () {
            var el = $messages.get(0);
            if (el) el.scrollTop = el.scrollHeight;
        }, 40);
    }

    function linkify(text) {
        if (!text) return '';
        var urlRegex = /(\b(https|http|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

        return text.replace(urlRegex, function (url) {
            var href = url;
            if (href.startsWith('www.')) {
                href = 'http://' + href;
            }
            return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
        });
    }






    


    $(function () { init(); });

})(jQuery);