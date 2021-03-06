import $ from '../../helpers/jquery'
import { checkExistence } from '../../helpers/checkExistence'
import getBrowser from '../../helpers/getBrowser'


class Bookmarks {

    constructor(){
        this.browser = getBrowser();
        this.cached_bookmarks = [];

        this.bookmark_search = $('.bookmark-search');
        this.bookmark_list = $('.bookmark-list');
        this.update_bookmark_btn = $('#update-bookmark');
        this.update_bookmark_form = $('#update-bookmark-form');
    }

    get_search(){
        this.browser.storage.local.get({'popup_search': ''}, (res) => {
            const value = res['popup_search'];
            if (value !== undefined) {
                this.bookmark_search.val(value);
                this.bookmark_search.select();
            }
        });
    }

    set_search(){
        this.browser.storage.local.set({'popup_search': this.bookmark_search.val()});
    }

    filter( obj, search ){
        const book_title = obj.title.toLowerCase();
        const searchlow = search.toLowerCase();

        return book_title.indexOf(searchlow) !== -1;
    }

    filter_bookmarks( array ){
        const search = this.bookmark_search.val();
        return array.filter((obj) => {
            return this.filter(obj, search);
        });
    }

    list_bookmarks() {

        this.bookmark_list.find('.book-wrap').remove();
        let filtered_books = this.filter_bookmarks(this.cached_bookmarks);

        let div;

        for (let book of filtered_books) {

            div = $('<div/>', {
                'class': "book-wrap",
            })
                .data(book)
                .text(book.title);

            this.bookmark_list.append(div);
        }
        this.move(1);
    }

    flatten_bookmarks( bookmarks ){

        let books = [];

        function flatten(bookmarks) {

            for (let book of bookmarks) {
                if (book.url && !/^(javascript:|place:|data:)/i.test(book.url)) {
                    books.push(book);

                }

                if (book.children) {
                    flatten(book.children);
                }
            }
        }

        flatten(bookmarks);
        return books;
    }

    get_all_bookmarks() {
        return new Promise((res, rej) => {
            getBrowser().bookmarks.getTree((bookmarks_tree) => {
                if (bookmarks_tree) {
                    res(this.flatten_bookmarks(bookmarks_tree))
                } else {
                    rej('No bookmarks found')
                }
            });
        })

    }

    async update_bookmark_list() {
        this.cached_bookmarks = await this.get_all_bookmarks();
        this.list_bookmarks();

    }

    goToURL( that ) {
        this.browser.tabs.create({
            active: true,
            url: that.data('url')
        });
    }

    goToURLBack( that ){

        this.browser.tabs.create({
            active: false,
            url: that.data('url')
        });
    }

    move( direction ) {
        const books = this.bookmark_list.find('.book-wrap');
        const selected = $('.selected');
        const idx = books.index(selected) + direction;
        const newselected = books.eq(idx);

        if ((idx >= 0) && newselected && (idx <= (books.length - 1))) {
            selected.removeClass('selected');
            newselected.addClass('selected');
        }
    }

    list_action( e ) {
        if (38 === e.keyCode) {
            e.preventDefault();
            return e.type === 'keydown' ? this.move(-1) : null;
        } else if (40 === e.keyCode) {
            e.preventDefault();
            return e.type === 'keydown' ? this.move(1) : null;
        } else if (13 === e.keyCode) {
            this.goToURL($('.book-wrap.selected'));
        }
        this.set_search();
        this.list_bookmarks();
    }

    clear_form() {
        this.update_bookmark_form.find('input:text, input:hidden').val('');
        this.update_bookmark_btn.addClass('hide');
    }

    load_bookmark( data ){
        this.update_bookmark_btn.removeClass('hide');
        this.update_bookmark_form.find('input:text, input:hidden').each(function () {
            const that = $(this);
            const value = data[that.attr('id')];
            that.val(value);
        });
    }

    update_bookmark() {
        const formData = this.update_bookmark_form.serializeArray().map((data) => {
            const obj = {};
            obj[data.name] = data.value;
            return obj;
        })
            .reduce((data, obj) => {
                return Object.assign(obj, data);
            }, {});

        const obj = {};
        obj['title'] = formData.title;
        obj['url'] = formData.url;
        if (obj['title'] !== undefined || obj['url'] !== undefined) {
            this.browser.bookmarks.update(formData.id, obj, () => {
                this.clear_form();
                this.update_bookmark_list();
            });
        }
    }


    mouse( e ){
        const target = $(e.target);
        switch (e.which) {
            case 3:
                this.load_bookmark(target.data());
                break;
            case 2:
                this.goToURLBack(target);
                break;
            default:
                this.goToURL(target);
                break;
        }
    }


    add_events(){
        const self = this;

        this.bookmark_search.on('keydown keyup', this.list_action.bind(this) );

        this.bookmark_list.on('mousedown', '.book-wrap', this.mouse.bind(this) );

        this.bookmark_list.contextmenu(() => false);

        this.update_bookmark_btn.contextmenu(() => false);

        $('.btn').on('click', e => e.preventDefault() );
        $('#cancel').on('click', this.clear_form.bind(this) );
        $('#save').on('click', this.update_bookmark.bind(this) );


        // Takes a bit for the popup to load even though the page says it loaded
        checkExistence('.bookmark-search', 5, () => {
            $(".bookmark-search").focus();
        })
    }

    run(){
        this.get_search();
        this.update_bookmark_list();
        this.add_events();
    }
}


const bookmarks = new Bookmarks();
export default bookmarks;