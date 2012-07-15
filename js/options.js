function loadFromStorage(storage) {
    $('input[name=auto_check]').each(function() {
        if ($(this).val() == storage.get_auto_check()) {
            $(this).attr('checked', 'checked');
        } else {
            $(this).removeAttr('checked');
        }
    });
    $('#auto_check_whitelist').val(
        storage.get_auto_check_whitelist().join("\n"));
    $('#auto_check_whitelist_customized').val(
        storage.get_auto_check_whitelist_customized());
    if (storage.get_auto_check_whitelist_customized()) {
        $('#customize_links span.yes').hide();
        $('#customize_links span.no').show();
        $('#auto_check_whitelist').removeAttr('readonly');
    } else {
        $('#customize_links span.no').hide();
        $('#customize_links span.yes').show();
        $('#auto_check_whitelist').attr('readonly', 'readonly');
    }
    if (storage.get_auto_check_https()) {
        $('#auto_check_https').attr('checked', 'checked');
    } else {
        $('#auto_check_https').removeAttr('checked');
    }
};

$(document).ready(function() {
    $(document).bind(
        'reddited-storage-loaded',
        function(event, storage) { loadFromStorage(storage); }
    );

    var storage = new Reddited.Storage();
    $('input[name=auto_check]').change(function() {
        storage.set_auto_check($(this).val()).save();
    });
    var f = function() {
        storage.set_auto_check_whitelist($(this).val()).save();
    };
    $('#auto_check_whitelist').change(f).blur(f).keyup(f);
    $('#auto_check_whitelist_customized').change(function() {
        storage.set_auto_check_whitelist_customized(
           $(this).is(':checked')).save();
    });
    $('#customize_links a').click(function() {
        storage.set_auto_check_whitelist_customized(
            !storage.get_auto_check_whitelist_customized()).save();
        loadFromStorage(storage);
    });
    $('#auto_check_https').change(function() {
        storage.set_auto_check_https($(this).is(':checked')).save();
    });
});
