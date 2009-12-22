// Regression test for infinite loop with 'break'
for (var i =0; i < 10; i++) {
  if (i == 5) break;
}

for (var i =0; i < 10; i++) {
  if (i == 5) continue;
}
