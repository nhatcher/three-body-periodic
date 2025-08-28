function getNames() {
    const examples = localStorage.getItem("examples");
    return examples ? Object.keys(JSON.parse(examples)) : [];
}

function getOrbit(name) {
    const examples = localStorage.getItem("examples");
    return JSON.parse(examples)[name];
}

export default {
    getNames,
    getOrbit
};