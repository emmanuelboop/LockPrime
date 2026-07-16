function InlineFormSuccess({ message }) {
    if (!message) {
        return null;
    }

    return (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            {message}
        </p>
    );
}

export default InlineFormSuccess;
