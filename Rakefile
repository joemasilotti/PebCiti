def system_or_exit(cmd, stdout = nil)
  puts "Executing #{cmd}"
  cmd += " >#{stdout}" if stdout
  system(cmd) or raise "******** Build failed ********"
end

task :default => [ :trim_whitespace ]

desc "Trim whitespace"
task :trim_whitespace do
  system_or_exit %Q[git status --porcelain | awk '{if ($1 != "D" && $1 != "R") print $NF}' | grep -e '.*\.[cmh]$' | xargs sed -i '' -e 's/	/    /g;s/ *$//g;']
end
